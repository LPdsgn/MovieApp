//
//  StarsRating.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 12/02/22.
//

import SwiftUI

struct StarsRating: View {
    let emptyStars: Int
    let filledStars: Int
    
    init(voteAverage: Float) {
        self.filledStars = Int(round(voteAverage / 2))
        self.emptyStars = 5 - filledStars
    }
    
    var body: some View {
        HStack {
            ForEach(0..<filledStars) { _ in Image(systemName: "star.fill") }
            ForEach(0..<emptyStars) { _ in Image(systemName: "star") }
        }
        .foregroundColor(Color("AccentDark"))
    }
}

struct StarsRating_Previews: PreviewProvider {
    static var previews: some View {
        StarsRating(voteAverage: 10)
    }
}
