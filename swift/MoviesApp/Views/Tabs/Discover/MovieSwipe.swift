//
//  MovieSwipe.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 14/02/22.
//

import SwiftUI

struct MovieSwipe: View {
    @EnvironmentObject var discoverViewModel: DiscoverViewModel
    
    @Namespace private var animation
    
    @Binding var isSwipeCardModalOpen: Bool
    
    @State private var showDetails = false
    @State private var tappedMovie: Movie? = nil

    private var movieCards: Array<DiscoverViewModel.MovieCard> {
        return discoverViewModel.movieCards
    }
    
    let closeButtonText = LocalizedStringKey("close")
    
    
    var body: some View {
        NavigationView {
            ZStack {
                if !showDetails {
                    VStack {
                        ZStack {
                            ForEach(movieCards) { movieCard in
                                if movieCard.id != movieCards.last!.id {
                                    // MARK: - Cards behind
                                    MovieCard(card: movieCard)
                                        .rotationEffect(
                                            .degrees(movieCard.rotationDegree)
                                        )
                                    
                                } else {
                                    // MARK: - First Card
                                    MovieCard(
                                        card: movieCard,
                                        animation: animation
                                    )
                                       .rotationEffect(.degrees(movieCard.rotationDegree))
                                        .onTapGesture { showDetailsOf(movieCard.movie) }
                                        .swipableCard(
                                            card: movieCard,
                                            onSwipeRightSuccess: discoverViewModel.makeMovieFavorite,
                                            onSwipeLeftSuccess: discoverViewModel.discardMovie,
                                            onSwipeDownSuccess: discoverViewModel.swipeToWatchList
                                        )
                                }
                            }
                        }
                        .padding()
                        .zIndex(3)
                        
                        DiscardFavoriteButtons(
                            makeFavorite: makeFavoriteButtonTapped,
                            discard: discardButtonTapped,
                            addToBookmark: bookmarkButtonTapped
                        )
                            .zIndex(1)
                    }
                    
                } else {
                    if let tappedMovie = tappedMovie {
                        MovieDetails(
                            movie: tappedMovie, showDetails: $showDetails,
                            animation: animation,
                            onBookmarkPressed: {
                                withAnimation {
                                    showDetails = false
                                }
                                
                                DispatchQueue.main
                                    .asyncAfter(deadline: .now() + 0.2, execute: bookmarkButtonTapped)
                            }
                            ,functionToCloseTheSheet: {
                                showDetails = false
                                isSwipeCardModalOpen = false
                            }
                        )
                        .statusBar(hidden: showDetails)
                    }
                }
            }
            .withBackground()
            .navigationBarHidden(showDetails)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
//                    Button("Close", action: closeButtonTapped)
                    Button(action: closeButtonTapped, label: {
                        Text(closeButtonText)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            
                    })
                }
            }
            
        }
        .onAppear {
            UINavigationBar.appearance().setBackgroundImage(UIImage(), for:.default)
            UINavigationBar.appearance().shadowImage = UIImage()
        }
        .onDisappear {
            UINavigationBar.appearance().setBackgroundImage(nil, for:.default)
            UINavigationBar.appearance().shadowImage = nil
        }
        
    }
    
    // MARK: - Functions
    
    func showDetailsOf(_ movie: Movie) {
        withAnimation(.interactiveSpring(response: 0.5, dampingFraction: 0.8, blendDuration: 0.8)) {
            showDetails.toggle()
            tappedMovie = movie
        }
    }
    
    func closeButtonTapped() {
        isSwipeCardModalOpen = false
    }
    
    func makeFavoriteButtonTapped() {
        withAnimation(.easeOut(duration: Constants.swipeAnimationSpeed)) {
            discoverViewModel.moveCard(movieCards[movieCards.last!], offset: .init(width: 500, height: 0))
            discoverViewModel.rotateCard(movieCards[movieCards.last!], degrees: 15)
        }
        discoverViewModel.makeMovieFavorite()
    }
    
    func discardButtonTapped() {
        withAnimation(.easeOut(duration: Constants.swipeAnimationSpeed)) {
            discoverViewModel.moveCard(movieCards[movieCards.last!], offset: .init(width: -500, height: 0))
            discoverViewModel.rotateCard(movieCards[movieCards.last!], degrees: -15)
        }
        discoverViewModel.discardMovie()
    }
    
    func bookmarkButtonTapped() {
        withAnimation(.easeOut(duration: Constants.swipeAnimationSpeed)) {
            discoverViewModel.moveCard(movieCards[movieCards.last!], offset: .init(width: 0, height: 800))
            discoverViewModel.rotateCard(movieCards[movieCards.last!], degrees: 0)
        }
        discoverViewModel.swipeToWatchList()
    }
}



struct MovieSwipe_Previews: PreviewProvider {
    
    static var previews: some View {
        MovieSwipe(isSwipeCardModalOpen: .constant(true))
            .environmentObject(DiscoverViewModel())
    }
}

