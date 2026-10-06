//
//  ImageCache.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 15/02/22.
//

import SwiftUI

class ImageCache {
    static private var cache = NSCache<NSString, UIImage>()
    
    static subscript(url: String) -> UIImage? {
        get {
            cache.object(forKey: url as NSString)
        }
        set {
            if let newValue = newValue {
                cache.setObject(newValue, forKey: url as NSString)
            }
        }
    }
    
    static func removeImageFromCache(with url: String?) {
        if let url = url {
            cache.removeObject(forKey: url as NSString)
        }
    }
    
    static func deleteCache(){
        cache.removeAllObjects()
    }
    
    private init() { }
}

