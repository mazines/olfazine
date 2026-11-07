// Native WebKit screenshots: renders pages in a real browser engine without a headless Chrome.
// Build: swiftc -O tools/wkshot.swift -o tools/wkshot
// Run:   tools/wkshot <file-url> <width> <height> <out.png> [fullPage:0|1]
import AppKit
import WebKit

final class Shooter: NSObject, WKNavigationDelegate {
  let web: WKWebView
  let out: String
  let full: Bool
  let size: NSSize
  let window: NSWindow

  init(url: URL, size: NSSize, out: String, full: Bool) {
    self.size = size
    self.out = out
    self.full = full
    let cfg = WKWebViewConfiguration()
    cfg.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
    web = WKWebView(frame: NSRect(origin: .zero, size: size), configuration: cfg)
    window = NSWindow(contentRect: NSRect(origin: .zero, size: size), styleMask: [.borderless], backing: .buffered, defer: false)
    super.init()
    window.contentView = web
    web.navigationDelegate = self
    let dir = url.deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
    web.loadFileURL(url, allowingReadAccessTo: dir)
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { self.snap() }
  }

  func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
    FileHandle.standardError.write("load failed: \(error)\n".data(using: .utf8)!); exit(2)
  }

  func snap() {
    // Report overflow so the caller can flag it.
    web.evaluateJavaScript("[document.documentElement.scrollWidth, document.documentElement.clientWidth, document.documentElement.scrollHeight]") { res, _ in
      var height = self.size.height
      if let a = res as? [NSNumber] {
        print("scrollWidth=\(a[0]) clientWidth=\(a[1]) scrollHeight=\(a[2])")
        if self.full { height = min(CGFloat(truncating: a[2]), 12000) }
      }
      let cfg = WKSnapshotConfiguration()
      if self.full {
        self.web.frame.size.height = height
        self.window.setContentSize(NSSize(width: self.size.width, height: height))
      }
      cfg.rect = NSRect(x: 0, y: 0, width: self.size.width, height: height)
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
        self.web.takeSnapshot(with: cfg) { img, err in
          guard let img = img, let tiff = img.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff),
                let png = rep.representation(using: .png, properties: [:]) else {
            FileHandle.standardError.write("snapshot failed: \(String(describing: err))\n".data(using: .utf8)!); exit(3)
          }
          try? png.write(to: URL(fileURLWithPath: self.out))
          exit(0)
        }
      }
    }
  }
}

let args = CommandLine.arguments
guard args.count >= 5, let url = URL(string: args[1]), let w = Double(args[2]), let h = Double(args[3]) else {
  print("usage: wkshot <file-url> <width> <height> <out.png> [full:0|1]"); exit(1)
}
let app = NSApplication.shared
app.setActivationPolicy(.prohibited)
let shooter = Shooter(url: url, size: NSSize(width: w, height: h), out: args[4], full: args.count > 5 && args[5] == "1")
DispatchQueue.main.asyncAfter(deadline: .now() + 15) { FileHandle.standardError.write("timeout\n".data(using: .utf8)!); exit(4) }
app.run()
