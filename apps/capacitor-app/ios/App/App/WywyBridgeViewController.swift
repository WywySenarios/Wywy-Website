import Capacitor
import WebKit

@objc class WywyBridgeViewController: CAPBridgeViewController, WKScriptMessageHandler {
    override func router() -> Router {
        return WywyRouter()
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "cookieHandler",
              let body = message.body as? [String: Any],
              let name = body["name"] as? String,
              let value = body["value"] as? String,
              let urlStr = body["url"] as? String,
              let url = URL(string: urlStr) else {
            return
        }

        let domain = body["domain"] as? String ?? url.host ?? "localhost"
        let path = body["path"] as? String ?? "/"
        let secure = body["secure"] as? Bool ?? (url.scheme == "https")

        var props: [HTTPCookiePropertyKey: Any] = [
            .name: name,
            .value: value,
            .domain: domain,
            .path: path,
        ]
        if secure { props[.secure] = "TRUE" }
        if let expires = body["expires"] as? Double {
            props[.expires] = Date(timeIntervalSince1970: expires)
        }

        if let cookie = HTTPCookie(properties: props) {
            webView?.configuration.websiteDataStore.httpCookieStore.setCookie(cookie)
        }
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        webView?.configuration.userContentController.add(self, name: "cookieHandler")
    }
}
