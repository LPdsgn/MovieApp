//
//  MovieCardGridItem.swift
//  MoviesApp
//
//  Created by Luigi Pedata on 16/02/22.
//

import SwiftUI
import Foundation

struct GridItemLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(alignment: .center, spacing: 3) {
            configuration.icon
            configuration.title
        }
    }
}

struct MovieCardGridItem: View {
    let movie : Movie
    
    var body: some View {
        
        ZStack(alignment: .bottom) {
            // MARK: Poster
            MoviePoster(posterPath: movie.posterPath, contentMode: .fit)
            
            HStack {
                VStack(alignment: .leading, spacing: 5) {
                    // MARK: Title
                    Text(movie.title)
                        .font(.title3)
                        .fontWeight(.semibold)
                        .lineLimit(1)
                    // MARK: Duration & Year
                    HStack(spacing: 10) {
                        Label(movie.formattedDuration, systemImage: "clock").labelStyle(GridItemLabelStyle())
                        Label(movie.year, systemImage: "calendar").labelStyle(GridItemLabelStyle())
                    }
                    .font(.system(size: 13))
                }
                Spacer()
                // MARK: Arrow
                Image(systemName: "chevron.right")
            }
            .frame(alignment: .leading)
            .padding(12)
            .background(.ultraThinMaterial)
        }
        .background(Color("Gray-800"))
        .cornerRadius(6)
        
    }
    
    
}

struct MovieCardLikedGridItem: View {
    let movie : Movie
    
    var body: some View {
        ZStack(alignment: .bottom) {
            ZStack {
                // MARK: Poster
                MoviePoster(posterPath: movie.posterPath, contentMode: .fit)
                    .overlay {
                        if let vote = movie.vote {
                            ZStack {
                                
                                Color("Gray-700").opacity(0.6)
                                Image(systemName: vote > 0 ? "heart.fill" : "xmark")
                                    .font(.title)
                                    .foregroundColor(vote > 0 ? .accentColor : .white)
                            }
                            
                        }
                        
                    }
                
            }
            
            HStack() {
                Text(movie.title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .lineLimit(1)
                Image(systemName: "chevron.right")
            }
            .padding(8)
        }
        .background(Color("Gray-800"))
        .cornerRadius(6)
        
    }
}

struct MovieCardGridItem_Previews: PreviewProvider {
    static var previews: some View {
        MovieCardGridItem(movie: Movie.example)
            .frame(width: 183)
    }
}

struct MovieCardLikedGridItem_Previews: PreviewProvider {
    static var previews: some View {
        MovieCardLikedGridItem(movie: Movie.example)
            .frame(width: 183)
    }
}
