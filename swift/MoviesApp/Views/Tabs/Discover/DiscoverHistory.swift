//
//  WatchlistSavedForLater.swift
//  MoviesApp
//
//  Created by Luigi Pedata on 15/02/22.
//

import SwiftUI

struct DiscoverHistory: View {
    @State private var searchQuery = ""
    @State private var filter: HistoryFilter = .all
    @EnvironmentObject var viewModel: DiscoverViewModel
    @StateObject var watchListViewModel = WatchlistViewModel.shared
    
    @Environment(\.horizontalSizeClass) var horizontalSizeClass: UserInterfaceSizeClass?
    @Environment(\.verticalSizeClass) var verticalSizeClass: UserInterfaceSizeClass?
    
    var filmHistory: Array<Movie> {
        var movies = watchListViewModel.getMovieAlreadyRecommended().reduce([],{ [$1] + $0 })
        
        if filter == .discarded {
            movies = movies.filter { $0.vote != nil && $0.vote! < 0 }
        } else if filter == .loved {
            movies = movies.filter { $0.vote != nil && $0.vote! > 0 }
        }
        
        if searchQuery.isEmpty {
            return movies
        } else {
            return movies.filter { movie in
                movie.title.contains(searchQuery)
            }
        }
        
    }
    
    private var threeColumnGrid = [GridItem(.flexible(), spacing:11), GridItem(.flexible(), spacing:11), GridItem(.flexible())]
    
    //MARK: Localization strings
    let discoverHistoryTitle = LocalizedStringKey("discover-history-title")
    let lovedFilterText = LocalizedStringKey("loved-history-filter")
    let discardedFilterText = LocalizedStringKey("discarded-history-filter")
    let allFilterText = LocalizedStringKey("all-history-filter")
    
    var body: some View {
        ScrollView(.vertical, showsIndicators: true) {
            // MARK: - Empty state placeholder
            if (filmHistory.count == 0) {
                VStack(spacing:10) {
                    Image("HistoryEmptyStatePlaceholder")
                    Text(LocalizedStringKey("history-empty-state"))
                        .font(.headline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                .offset(y: UIScreen.main.bounds.height / 4)
            } else {
                // MARK: - Swiped movies grid
                //LazyVGrid(columns: threeColumnGrid, spacing: 14) {
                LazyVGrid(
                    columns: [GridItem(.adaptive(minimum: 110, maximum: .infinity), spacing: 14)],
                    spacing: 14
                ) {
                    ForEach(filmHistory) { newRecord in
                        NavigationLink {
                            MovieDetails(movie: newRecord)
                        } label: { MovieCardLikedGridItem(movie: newRecord) }
                        .foregroundColor(Color.white)
                    }
                }
                .padding()
            }
        }
        .navigationTitle(discoverHistoryTitle)
        .navigationBarTitleDisplayMode(.inline)
        .withBackground()
        .searchable(text: $searchQuery)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Picker(selection: $filter, label:Text("Filter options")) {
                        
                        Label(lovedFilterText, systemImage: "heart.fill")
                            .tag(HistoryFilter.loved)
                        
                        Label(discardedFilterText, systemImage: "xmark")
                            .tag(HistoryFilter.discarded)
                        
                        Text(allFilterText)
                            .tag(HistoryFilter.all)
                        
                    }
                }
            label: {
                Image(systemName: "line.3.horizontal.decrease")
            }
                
            }
        }
        
    }
}

enum HistoryFilter {
    case loved, discarded, all
}

struct DiscoverHistory_Previews: PreviewProvider {
    static var previews: some View {
        DiscoverHistory()
            .environmentObject(WatchlistViewModel.shared)
    }
}
