//
//  ImageLoader.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 15/02/22.
//

import Foundation
import UIKit

enum NetworkError: Error {
    case badRequest
    case unsupportedImage
    case badUrl
}

@MainActor
class ImageLoaderViewModel: ObservableObject {
    
    @Published var uiImage: UIImage?
    
    func fetchImage(_ url: URL?) async throws {
        
        guard let url = url else {
            throw NetworkError.badUrl
        }
        
        let request = URLRequest(url: url)
        
        
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
                  throw NetworkError.badRequest
              }
        
        guard let image = UIImage(data: data) else {
            throw NetworkError.unsupportedImage
        }
        
        // store it in the cache
        ImageCache[url.absoluteString] = image
        uiImage = image
        
    }
    
}
