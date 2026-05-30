import Foundation
import Capacitor

class WywyRouter: Router {
    var basePath: String = ""

    func route(for path: String) -> String {
        let pathUrl = URL(fileURLWithPath: path)

        if !pathUrl.pathExtension.isEmpty {
            return basePath + path
        }

        if path == "/" || path.isEmpty {
            return basePath + "/index.html"
        }

        let normalizedPath = path.hasPrefix("/") ? path : "/" + path

        let indexPath = basePath + normalizedPath + "/index.html"
        if FileManager.default.fileExists(atPath: indexPath) {
            return indexPath
        }

        var isDir: ObjCBool = false
        if FileManager.default.fileExists(atPath: basePath + normalizedPath, isDirectory: &isDir), isDir.boolValue {
            return basePath + normalizedPath + "/index.html"
        }

        return basePath + "/index.html"
    }
}
