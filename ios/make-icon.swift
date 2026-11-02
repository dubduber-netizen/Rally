import AppKit
let size = NSSize(width: 1024, height: 1024)
let image = NSImage(size: size)
image.lockFocus()
NSColor(srgbRed: 21/255, green: 27/255, blue: 24/255, alpha: 1).setFill()
NSBezierPath(rect: NSRect(origin: .zero, size: size)).fill()
NSColor(srgbRed: 199/255, green: 217/255, blue: 154/255, alpha: 1).setFill()
let circle = NSBezierPath(ovalIn: NSRect(x: 210, y: 210, width: 604, height: 604)); circle.fill()
NSGraphicsContext.saveGraphicsState(); circle.addClip()
NSColor(srgbRed: 239/255, green: 238/255, blue: 219/255, alpha: 1).setStroke()
for x in [-175.0, 800.0] {
 let seam = NSBezierPath(ovalIn: NSRect(x: x, y: 172, width: 400, height: 680)); seam.lineWidth = 23; seam.stroke()
}
NSGraphicsContext.restoreGraphicsState()
image.unlockFocus()
let rep = NSBitmapImageRep(data: image.tiffRepresentation!)!
let png = rep.representation(using: .png, properties: [:])!
try png.write(to: URL(fileURLWithPath: CommandLine.arguments[1]))
