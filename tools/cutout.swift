// Cut a product out of its photo with Apple's Vision foreground mask (macOS 14+).
// Build: swiftc -O -sdk /Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk tools/cutout.swift -o tools/cutout
// Run:   tools/cutout <in.jpg|png> <out.png> [targetHeight=800] [paddingFraction=0.06]
// Output: transparent PNG, trimmed to the subject, scaled to a fixed height, even padding.
import AppKit
import CoreImage
import Vision

let args = CommandLine.arguments
guard args.count >= 3 else { print("usage: cutout <in> <out.png> [targetHeight] [padding]"); exit(1) }
let targetH = args.count > 3 ? CGFloat(Double(args[3]) ?? 800) : 800
let padFrac = args.count > 4 ? CGFloat(Double(args[4]) ?? 0.06) : 0.06

guard let src = CIImage(contentsOf: URL(fileURLWithPath: args[1])) else { print("cannot read \(args[1])"); exit(2) }
let handler = VNImageRequestHandler(ciImage: src)
let request = VNGenerateForegroundInstanceMaskRequest()
do { try handler.perform([request]) } catch { print("vision failed: \(error)"); exit(3) }
guard let result = request.results?.first else { print("no subject found"); exit(4) }

// Keep every detected instance (bottle + cap can come back as one or two instances).
let maskBuffer: CVPixelBuffer
do {
  maskBuffer = try result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler)
} catch { print("mask failed: \(error)"); exit(5) }
// Tighten edges: drop low-confidence pixels (ghost fringes), keep a soft 1-2px edge.
// alpha' = clamp(alpha * k - (k - 1) / 2) with k = 2 maps 0.25..0.75 onto 0..1.
let rawMask = CIImage(cvPixelBuffer: maskBuffer)
let tighten = CIFilter(name: "CIColorMatrix")!
tighten.setValue(rawMask, forKey: kCIInputImageKey)
for key in ["inputRVector", "inputGVector", "inputBVector"] {
  let v = key == "inputRVector" ? CIVector(x: 2, y: 0, z: 0, w: 0) : key == "inputGVector" ? CIVector(x: 0, y: 2, z: 0, w: 0) : CIVector(x: 0, y: 0, z: 2, w: 0)
  tighten.setValue(v, forKey: key)
}
tighten.setValue(CIVector(x: -0.5, y: -0.5, z: -0.5, w: 0), forKey: "inputBiasVector")
let mask = ProcessInfo.processInfo.environment["CUTOUT_SOFT"] == "1"
  ? rawMask
  : tighten.outputImage!.applyingFilter("CIColorClamp").cropped(to: rawMask.extent)

// Composite subject over transparency.
let blend = CIFilter(name: "CIBlendWithMask")!
blend.setValue(src, forKey: kCIInputImageKey)
blend.setValue(CIImage(color: .clear).cropped(to: src.extent), forKey: kCIInputBackgroundImageKey)
blend.setValue(mask, forKey: kCIInputMaskImageKey)
let cut = blend.outputImage!

// Trim to the mask's bounding box.
let ctx = CIContext()
guard let maskCG = ctx.createCGImage(mask, from: mask.extent) else { exit(6) }
let w = maskCG.width, h = maskCG.height
var px = [UInt8](repeating: 0, count: w * h)
let gray = CGContext(data: &px, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w,
                     space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue)!
gray.draw(maskCG, in: CGRect(x: 0, y: 0, width: w, height: h))
var minX = w, minY = h, maxX = -1, maxY = -1
for y in 0..<h { for x in 0..<w where px[y * w + x] > 24 {
  minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y)
} }
guard maxX >= 0 else { print("empty mask"); exit(7) }
// CGContext rows run top-down here; CIImage y runs bottom-up.
let box = CGRect(x: minX, y: h - 1 - maxY, width: maxX - minX + 1, height: maxY - minY + 1)
let coverage = Double(box.width * box.height) / Double(w * h)

// Scale subject to a fixed height inside a padded canvas so every bottle lines up.
let inner = targetH * (1 - 2 * padFrac)
let scale = inner / box.height
let outW = ceil(box.width * scale + 2 * padFrac * targetH)
let scaled = cut.cropped(to: box)
  .transformed(by: CGAffineTransform(translationX: -box.minX, y: -box.minY))
  .transformed(by: CGAffineTransform(scaleX: scale, y: scale))
  .transformed(by: CGAffineTransform(translationX: padFrac * targetH, y: padFrac * targetH))
let canvas = CGRect(x: 0, y: 0, width: outW, height: targetH)
guard let outCG = ctx.createCGImage(scaled.cropped(to: canvas), from: canvas, format: .RGBA8,
                                    colorSpace: CGColorSpace(name: CGColorSpace.sRGB)) else { exit(8) }
let rep = NSBitmapImageRep(cgImage: outCG)
try rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: args[2]))
print(String(format: "ok instances=%d box=%dx%d coverage=%.0f%% out=%dx%d", result.allInstances.count,
             Int(box.width), Int(box.height), coverage * 100, Int(outW), Int(targetH)))
