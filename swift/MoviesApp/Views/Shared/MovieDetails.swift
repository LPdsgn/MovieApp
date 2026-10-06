//
//  MovieCardDetails.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 12/02/22.
//

import SwiftUI

struct MovieDetails: View {
    
    @Environment(\.presentationMode) var goback: Binding<PresentationMode>
    @EnvironmentObject var viewModel: DiscoverViewModel

    let movie: Movie
    var onBookmarkPressed: (() -> Void)?
    var returnToPopcorn:(() ->Void)? = nil
    @Binding var showDetails: Bool
    var animation: Namespace.ID?
    
    @Namespace var animationPlaceholder
    
    @State var isSaved = false
    @State private var scale: CGFloat = 1
    @State private var cornerRadius: CGFloat = 0
    @State private var forceUIRefresh = false
    
    
    init(movie: Movie, showDetails: Binding<Bool> = .constant(true), animation: Namespace.ID? = nil, onBookmarkPressed: (() -> Void)? = nil,functionToCloseTheSheet:(() -> Void)? = nil ) {
        self.movie = movie
        self._showDetails = showDetails
        self.animation = animation
        self.onBookmarkPressed = onBookmarkPressed
        self.returnToPopcorn = functionToCloseTheSheet
        
    }
    
    // If animation is not passed, it passes an animation id placeholder
    private var animationNamespace: Namespace.ID {
        animation != nil ? animation! : animationPlaceholder
    }
    
    
    var body: some View {
        let isBookmarked = movie.isSaved ?? false
        
        ZStack {
            
            // MARK: - Movie Poster
            VStack {
                MoviePoster(posterPath: movie.posterPath)
                    .matchedGeometryEffect(id: "movie-poster", in: animationNamespace)
                
                Spacer()
            }
            
            // MARK: - Background Overlay
            LinearGradient(colors: [.clear, .init("Gray-700"), .init("Gray-700")], startPoint: .top, endPoint: .bottom)
            
            
            // MARK: - Movie Informations
            ScrollView(showsIndicators: false) {
                VStack {
                    VStack(alignment: .trailing) {
                        
                        // Visible part of the poster
                            Color.clear
                                .contentShape(Rectangle())
                                .frame(height: 300)
                        
                        
                        //MARK: Drag gesture to close modal
                        .gesture(
                            DragGesture(minimumDistance: 0, coordinateSpace: .global)
                                .onChanged(onPosterDragChanged)
                                .onEnded(onPosterDragEnded)
                        )
                        
                        Group {
                            //MARK: Title
                            Text(movie.title)
                                .font(.largeTitle)
                                .fontWeight(.semibold)
                                .shadow(color: .black.opacity(0.5), radius: 4, x: 0, y: 2)
                                .matchedGeometryEffect(id: "movie-title", in: animationNamespace)
                            
                            
                            HStack {
                                VStack(alignment: .leading, spacing: 16) {
                                    //MARK: Genres
                                    MovieGenres(movie.genres)
                                        .matchedGeometryEffect(id: "movie-genres", in: animationNamespace)
                                    
                                    //MARK: Duration and year
                                    HStack(spacing: 20) {
                                        Label(movie.formattedDuration, systemImage: "clock")
                                        Label(movie.year, systemImage: "calendar")
                                    }
                                    .font(.body)
                                    .matchedGeometryEffect(id: "movie-time", in: animationNamespace)
                                    
                                    //MARK: Ratings
                                    StarsRating(voteAverage: movie.voteAverage)
                                        .matchedGeometryEffect(id: "movie-stars", in: animationNamespace)
                                }
                                
                                Spacer()
                                
                                Button(action: handleBookmark, label: { Image(systemName: isBookmarked ? "bookmark.fill" : "bookmark") })
                                    .buttonStyle(SkeumorphicButtonStyle(isBookmarked ? .primary : .secondary))
                                    .foregroundColor(isBookmarked ? .white : .accentColor)
                                    .frame(width: 75, height: 75)
                                
                            }
                            
                            //MARK: Overview
                            Text(movie.overview)
                                .padding(.top)
                            
                            
                        }
                        .hLeading()
                        
                        
                    }
                    .padding(.horizontal)
                    .foregroundColor(.white)
                    
                    if let credits = movie.credits {
                        MovieCredits(credits: credits)
                            .padding(.top)
                    }
                    
                    //MARK: Providers
                    if let _ = movie.providers {
                        
                        MovieProviders(movie.getLocalProviders(), returnToPopCorn: {
                            if let returnToPopcorn = returnToPopcorn {
                                returnToPopcorn()
                            }
                        })
                            .padding(.top)
                        
                    }
                    
                   
                    
                    Spacer()
                }
                .padding(.bottom, 80)
            }
            
            // MARK: - Close button
            if animation != nil {
                Button {
                    withAnimation {
                        showDetails.toggle()
                    }
                } label: {
                    Circle()
                        .fill(.ultraThinMaterial)
                        .frame(width: 40, height: 40)
                        .overlay {
                            Image(systemName: "xmark")
                                .foregroundColor(.white)
                        }
                    
                }
                .position(
                    x: getScreenBounds().width - 45,
                    y: 45
                )
            }
        }
        .onChange(of: forceUIRefresh, perform: { _ in })
        .cornerRadius(cornerRadius)
        .scaleEffect(scale)
        .edgesIgnoringSafeArea(.all)
        .task {
            do{
                try await viewModel.getProviders(movie: self.movie)
            }
            catch {
                
            }
        }
    
        
    }
    
    // MARK: - Functions
    func onPosterDragChanged(value: DragGesture.Value) {
        guard let _ = animation else {
            return
        }

        let progress = value.translation.height / getScreenBounds().height
        
        let scale = 1 - progress
        if scale > 0.8 {
            self.scale = scale
        }
        
        let cornerRadius = (progress / 0.15) * 8
        if cornerRadius < Constants.CornerRadius {
            self.cornerRadius = cornerRadius
        }
    }
    
    func onPosterDragEnded(value: DragGesture.Value) {
        guard let _ = animation else {
            return
        }
        
        withAnimation(.spring()) {
            if scale < 0.9 {
                showDetails.toggle()
            }
            scale = 1
            
        }
    }
    
    func handleBookmark() {
        if (!self.movie.isSaved!) {
            
            if let onBookmarkPressed = onBookmarkPressed {
                onBookmarkPressed()
            } else {
                WatchlistViewModel.shared.addToWatchList(self.movie)
            }
            
        } else {
            WatchlistViewModel.shared.removeFromWatchList(self.movie)
        }
        self.movie.isSaved!.toggle()
        forceUIRefresh.toggle()
    }
}

struct MovieDetails_Previews: PreviewProvider {
    struct TestView: View {
        @Namespace var ns
        var body: some View {
            MovieDetails(movie: .example, showDetails: .constant(true), animation: ns)
        }
    }
    static var previews: some View {
        TestView()
    }
}
