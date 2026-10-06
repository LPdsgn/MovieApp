//
//  MovieGenres.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 21/02/22.
//

import SwiftUI

struct MovieGenres: View {
    let movieGenres: Array<Genre>
    
    init(_ movieGenres: Array<Genre>) {
        var limitedArrMovieGenres = Array<Genre>()
        for i in 0..<3 {
            if let genre = movieGenres[safe: i] {
                limitedArrMovieGenres.append(genre)
            }
        }
        self.movieGenres = limitedArrMovieGenres
    }
    
    var body: some View {
        HStack {
            ForEach(movieGenres) { genre in
                Text(genre.name)
                    .foregroundColor(.white)
                    .font(.footnote)
                    .fontWeight(.medium)
                    .lineLimit(1)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(.thickMaterial)
                    .cornerRadius(9999)
            }
            
        }
    }
}

struct MovieGenres_Previews: PreviewProvider {
    static var previews: some View {
        MovieGenres(Movie.example.genres)
    }
}
