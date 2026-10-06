//
//  Constants.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 12/02/22.
//

import Foundation
import SwiftUI

struct Constants {
    static let ImagesBasePath = "https://image.tmdb.org/t/p/w500"
    static let CornerRadius = 8.0
    static let maxImageCacheNum = 120
    static let swipeAnimationSpeed = 0.3
    
    static let CircleAspectRatio: CGFloat = 1/1
    
    // MARK: - Cards
    static let CardAspectRatio: CGFloat = 2/3 // Movie poster's aspect ratio
    static let NumOfCards: Int = 3
    static let CardMovieOverviewLineLimit: Int = 2
    static let PosterOverlayGradient: Gradient = .init(
        colors: [
            .init("Gray-900").opacity(0.75),
            .init("Gray-900").opacity(0.55),
            .init("Gray-900").opacity(0),
        ]
    )
    
    // MARK: Shadows
    static let CardShadowColor: Color = .init("Gray-900").opacity(0.8)
    static let CardShadowRadius: CGFloat = 5
    static let CardShadowPosition: CGPoint = .zero
    static let MovieTitleTextShadowColor: Color = .black.opacity(0.5)
    static let MovieTitleTextShadowRadius: CGFloat = 4
    static let MovieTitleTextShadowPosition: CGPoint = .init(x: 0, y: 2)

    
    // MARK: Spacing
    static let HeaderVSpacing: CGFloat = 10
    static let DurationYearHSpacing: CGFloat = 20
    
    
    static let AppBackground = LinearGradient(
        gradient: Gradient(colors: [.init("Gray-700"), .init("Gray-800")]),
        startPoint: .top, endPoint: .bottom
    )
}


/// Provider Name -> ID
enum StreamingProvider: Int {
    case Netflix = 8
    case AppleTv = 350
    case DisneyPlus = 337
    case PrimeVideo = 10
}
