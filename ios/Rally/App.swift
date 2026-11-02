import UIKit
import WebKit

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let window = UIWindow(frame: UIScreen.main.bounds)
        window.rootViewController = GameViewController()
        window.makeKeyAndVisible()
        self.window = window
        return true
    }
}

final class GameViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate {
    private let origin = URL(string: "https://rally-tennis.dubduber.chatgpt.site")!
    private var webView: WKWebView!
    private var tasks: [Int: URLSessionDataTask] = [:]
    private lazy var session: URLSession = {
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 15
        config.timeoutIntervalForResource = 20
        config.httpShouldSetCookies = false
        return URLSession(configuration: config)
    }()
    private let feedback = UIImpactFeedbackGenerator(style: .light)

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 21/255, green: 27/255, blue: 24/255, alpha: 1)
        let controller = WKUserContentController()
        controller.add(self, name: "rally")
        let bridgeURL = Bundle.main.url(forResource: "bridge", withExtension: "js")!
        let script = try! String(contentsOf: bridgeURL, encoding: .utf8)
        controller.addUserScript(WKUserScript(source: script, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        let config = WKWebViewConfiguration()
        config.userContentController = controller
        config.websiteDataStore = .default()
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = view.backgroundColor
        webView.scrollView.backgroundColor = view.backgroundColor
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor)
        ])
        let game = Bundle.main.url(forResource: "game", withExtension: "html")!
        webView.loadFileURL(game, allowingReadAccessTo: game.deletingLastPathComponent())
        NotificationCenter.default.addObserver(self, selector: #selector(pauseGame), name: UIApplication.willResignActiveNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(resumeGame), name: UIApplication.didBecomeActiveNotification, object: nil)
    }
    @objc private func pauseGame() { setPaused(true) }
    @objc private func resumeGame() { setPaused(false) }
    private func setPaused(_ value: Bool) {
        webView.evaluateJavaScript("window.rallyAppPaused = \(value ? "true" : "false"); window.dispatchEvent(new Event('rallyappstate'));")
    }
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, message.frameInfo.request.url?.isFileURL == true,
              let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        switch type {
        case "fetch": fetch(body)
        case "cancel": if let id = body["id"] as? Int { tasks.removeValue(forKey: id)?.cancel() }
        case "copy": if let text = body["text"] as? String, text.count <= 4096 { UIPasteboard.general.string = text }
        case "share":
            guard let raw = body["url"] as? String, let url = URL(string: raw), url.scheme == "https", url.host == origin.host else { return }
            let activity = UIActivityViewController(activityItems: ["Play Rally Tennis with me", url], applicationActivities: nil)
            activity.popoverPresentationController?.sourceView = view
            present(activity, animated: true)
        case "haptic": feedback.impactOccurred(intensity: 0.45)
        default: break
        }
    }
    private func fetch(_ body: [String: Any]) {
        guard let id = body["id"] as? Int, id > 0 else { return }
        guard tasks.count < 20, let path = body["path"] as? String,
              path.range(of: #"^/api/(rooms(?:/[A-Z0-9]{4,8}(?:/join)?)?|ranked/[a-z]+|relay/[a-f0-9-]{36})$"#, options: .regularExpression) != nil,
              let method = body["method"] as? String, ["GET", "POST", "PATCH", "DELETE"].contains(method),
              let url = URL(string: path, relativeTo: origin)?.absoluteURL, url.host == origin.host else {
            reply(id, ["error": "Invalid game request"]); return
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let headers = body["headers"] as? [String: String] {
            for name in ["x-rally-token", "x-player-token"] {
                if let value = headers[name], value.count <= 128 { request.setValue(value, forHTTPHeaderField: name) }
            }
        }
        if let raw = body["body"] as? String {
            guard raw.utf8.count <= 100000 else { reply(id, ["error": "Game request too large"]); return }
            request.httpBody = raw.data(using: .utf8)
        }
        let task = session.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                guard let self else { return }
                self.tasks.removeValue(forKey: id)
                if let error { self.reply(id, ["error": error.localizedDescription]); return }
                guard let http = response as? HTTPURLResponse, let data, data.count <= 200000,
                      let text = String(data: data, encoding: .utf8) else { self.reply(id, ["error": "Invalid game response"]); return }
                self.reply(id, ["status": http.statusCode, "body": text])
            }
        }
        tasks[id] = task
        task.resume()
    }
    private func reply(_ id: Int, _ result: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: result, options: [.fragmentsAllowed]),
              let json = String(data: data, encoding: .utf8) else { return }
        webView.evaluateJavaScript("window.rallyNativeReply(\(id), \(json));")
    }
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { decisionHandler(.cancel); return }
        if url.isFileURL, url.standardizedFileURL == Bundle.main.url(forResource: "game", withExtension: "html")?.standardizedFileURL {
            decisionHandler(.allow); return
        }
        if action.navigationType == .linkActivated, url.scheme == "https" { UIApplication.shared.open(url) }
        decisionHandler(.cancel)
    }
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url, url.scheme == "https" { UIApplication.shared.open(url) }
        return nil
    }
}
