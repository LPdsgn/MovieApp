//
//  MoviePoster.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 12/02/22.
//

import SwiftUI

struct MoviePoster: View {
    var url: URL? = nil
    let contentMode: ContentMode
    
    @StateObject private var imageLoader = ImageLoaderViewModel()
    
    
    init(posterPath: String?, contentMode: ContentMode = .fit) {
        self.contentMode = contentMode
        if let posterPath = posterPath {
            self.url = URL(string: Constants.ImagesBasePath + posterPath)
        }
    }

    
    var body: some View {
        VStack {
            
            if let url = url, let cachedImage = ImageCache[url.absoluteString] {
                Image(uiImage: cachedImage)
                    .resizable()
                    .aspectRatio(Constants.CardAspectRatio, contentMode: contentMode)

            } else if let uiImage = imageLoader.uiImage {
                Image(uiImage: uiImage)
                    .resizable()
                    .aspectRatio(Constants.CardAspectRatio, contentMode: contentMode)
            
                
            } else {
                Image("placeholder")
                    .resizable()
                    .aspectRatio(Constants.CardAspectRatio, contentMode: contentMode)
                    .task {
                        await downloadImage()
                    }
            }
        }
    }
    
    private func downloadImage() async {
        do {
            try await imageLoader.fetchImage(url)
        } catch {
            print(error)
        }
    }

}

struct MoviePoster_Previews: PreviewProvider {
    static var previews: some View {
        MoviePoster(posterPath: Movie.example.posterPath)
    }
}
