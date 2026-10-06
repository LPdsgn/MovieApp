//
//  MovieResultListItem.swift
//  MoviesApp
//
//  Created by Luigi Pedata on 28/02/22.
//

import SwiftUI
import Foundation

struct MovieResultListItem: View {
    let movie : Movie
    @EnvironmentObject var discoverViewController: DiscoverViewModel
    
    
    var body: some View {
        HStack(spacing: 0) {
            // MARK: Poster
            MoviePoster(posterPath: movie.posterPath, contentMode: .fit)
                .frame(maxWidth: 85)
            
            // MARK: Infos
            HStack {
                VStack(alignment: .leading, spacing: 5) {
                    // MARK: Title
                    Text(movie.title)
                        .font(.title3)
                        .fontWeight(.semibold)
                        .lineLimit(2)
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
            .padding()
        }
    }
}

struct MovieResultListItem_Previews: PreviewProvider {
    static var previews: some View {
        MovieResultListItem(movie: Movie.example)
    }
}
