//
//  MovieCard.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 12/02/22.
//

import SwiftUI

struct MovieCard: View {
    @Namespace var animationPlaceholder
    @EnvironmentObject var discoverViewController: DiscoverViewModel
    
    let card: DiscoverViewModel.MovieCard
    var animation: Namespace.ID?
    
    var movie: Movie { card.movie }
    
    var horizontalSwipeProgress: CGFloat {
        if let lastCard = discoverViewController.movieCards.last, lastCard.id == card.id {
            return discoverViewController.movieCards[lastCard].offset.width / getScreenBounds().width
        }
        return 0
    }
    
    var verticalSwipeProgress: CGFloat {
        if let lastCard = discoverViewController.movieCards.last, lastCard.id == card.id {
            return discoverViewController.movieCards[lastCard].offset.height / getScreenBounds().height
        }
        return 0
    }
    
    
    init(card: DiscoverViewModel.MovieCard, animation: Namespace.ID? = nil) {
        self.card = card
        self.animation = animation
    }
    
    
    // If animation is not passed, it passes an animation id placeholder
    private var animationNamespace: Namespace.ID {
        animation != nil ? animation! : animationPlaceholder
    }
    
    var body: some View {
        ZStack {
            // MARK: - Movie Poster
            MoviePoster(posterPath: movie.posterPath, contentMode: .fill)
                .matchedGeometryEffect(id: "movie-poster", in: animationNamespace)
            
            // MARK: - Gradient Overlay
            posterOverlay()
            
            // MARK: - Movie Header
            VStack(spacing: Constants.HeaderVSpacing) {
                Spacer()
                
                Group {
                    // MARK: Title
                    Text(movie.title)
                        .font(.largeTitle)
                        .fontWeight(.semibold)
                        .shadow(
                            color: Constants.MovieTitleTextShadowColor,
                            radius: Constants.MovieTitleTextShadowRadius,
                            x: Constants.MovieTitleTextShadowPosition.x,
                            y: Constants.MovieTitleTextShadowPosition.y
                        )
                        .matchedGeometryEffect(id: "movie-title", in: animationNamespace)
                    
                    MovieGenres(movie.genres)
                        .matchedGeometryEffect(id: "movie-genres", in: animationNamespace)
                    
                    
                    // MARK: Overview
                    Text(movie.overview)
                        .font(.caption)
                        .lineLimit(Constants.CardMovieOverviewLineLimit)
                    
                    // MARK: Duration & Year
                    HStack(spacing: Constants.DurationYearHSpacing) {
                        Label(movie.formattedDuration, systemImage: "clock")
                        Label(movie.year, systemImage: "calendar")
                    }
                    .font(.body)
                    .matchedGeometryEffect(id: "movie-time", in: animationNamespace)
                    
                    // MARK: Rating
                    StarsRating(voteAverage: movie.voteAverage)
                        .matchedGeometryEffect(id: "movie-stars", in: animationNamespace)
                    
                }
                .hLeading()
                
            }
            .padding()
            .foregroundColor(.white)
            
            
            ZStack {
                LikedLabel()
                    .padding()
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                    .opacity(getLovedOpacity())
                
                DiscardedLabel()
                    .padding()
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
                    .opacity(getDiscardedOpacity())
                
                SavedLabel()
                    .padding()
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                    .opacity(getBookmarkedOpacity())
            }
            
            
            
        }
        .aspectRatio(Constants.CardAspectRatio, contentMode: .fit)
        .cornerRadius(Constants.CornerRadius)
        .padding(.horizontal)
        .shadow(
            color: Constants.CardShadowColor,
            radius: Constants.CardShadowRadius,
            x: Constants.CardShadowPosition.x,
            y: Constants.CardShadowPosition.y
        )
    }
    
    // MARK: - Functions
    func posterOverlay() -> some View {
        LinearGradient(
            gradient: Constants.PosterOverlayGradient,
            startPoint: .bottom, endPoint: .top
        )
    }
    
    func getLovedOpacity() -> CGFloat {
        return (horizontalSwipeProgress - 0.2) * 5
    }
    
    func getDiscardedOpacity() -> CGFloat {
        return (horizontalSwipeProgress + 0.2) * -5
    }
    
    func getBookmarkedOpacity() -> CGFloat {
        let verticalOpacity = (verticalSwipeProgress - 0.1) * 5
        return verticalOpacity - abs((verticalOpacity * (horizontalSwipeProgress / 0.2)))
    }
}

struct CardView_Previews: PreviewProvider {
    
    private struct TestView: View {
        @Namespace var animation
        
        var body: some View {
            MovieCard(card: DiscoverViewModel.MovieCard(movie: Movie.example), animation: animation)
                .padding()
                .withBackground()
        }
    }
    
    static var previews: some View {
        TestView()
    }
}
