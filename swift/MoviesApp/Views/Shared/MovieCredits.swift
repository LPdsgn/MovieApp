//
//  MovieCredits.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 07/03/22.
//

import SwiftUI

struct MovieCredits: View {
    let credits: Credits
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(LocalizedStringKey("movie-credits-title"))
                .font(.callout.smallCaps())
                .foregroundStyle(.secondary)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(credits.cast) { cast in
                        MovieCastPhoto(name: cast.name, path: cast.profilePath)
                    }
                }
            }
        }
        .padding(.horizontal)
    }
}

struct MovieCastPhoto: View {
    let name: String
    var url: URL? = nil
    
    @StateObject private var imageLoader = ImageLoaderViewModel()
    
    
    init(name: String, path: String?) {
        self.name = name
        if let path = path {
            self.url = URL(string: Constants.ImagesBasePath + path)
        }
    }
    
    
    var body: some View {
        VStack {
            
            if let url = url, let cachedImage = ImageCache[url.absoluteString] {
                Image(uiImage: cachedImage)
                    .resizable()
                    .aspectRatio(Constants.CardAspectRatio, contentMode: .fill)
                    .cornerRadius(6)
                
            } else if let uiImage = imageLoader.uiImage {
                Image(uiImage: uiImage)
                    .resizable()
                    .aspectRatio(Constants.CardAspectRatio, contentMode: .fill)
                    .cornerRadius(6)
                    
                
            } else {
                Image("cast-placeholder")
                    .resizable()
                    .scaledToFill()
                    .frame(maxWidth:100)
                    //.aspectRatio(Constants.CardAspectRatio, contentMode: .fill)
                    .cornerRadius(6)
                    .task {
                        await downloadImage()
                    }
            }
            
            Text(name)
                .font(.footnote)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .lineLimit(1)
        }
        .frame(width: 100)
    }
    
    private func downloadImage() async {
        do {
            try await imageLoader.fetchImage(url)
        } catch {
            print(error)
        }
    }
}

struct MovieCast_Previews: PreviewProvider {
    static var previews: some View {
        VStack {
            MovieCastPhoto(name: "John Formaggio", path: "/5XBzD5WuTyVQZeS4VI25z2moMeY.jpg")
            
            MovieCastPhoto(name: "John Formaggio", path: nil)

        }

    }
}
