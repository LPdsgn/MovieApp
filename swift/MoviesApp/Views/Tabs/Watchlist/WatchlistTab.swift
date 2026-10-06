//
//  WatchlistTab.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 14/02/22.
//

import SwiftUI
import Foundation

struct WatchlistTab: View {
    
    @EnvironmentObject var viewModel: WatchlistViewModel
    @EnvironmentObject var viewModel2:DiscoverViewModel
    @State private var searchText = ""
    
    var movie: Set<Movie> {
        let movies = viewModel.getWatchList()
        if searchText.isEmpty {
            return movies
        }
        
        return movies.filter { $0.title.contains(searchText) }
    }
    
    var body: some View {
        NavigationView {
            ScrollView(.vertical, showsIndicators: true) {
                // MARK: - Empty state placeholder
                if (viewModel.getWatchList().count == 0) {
                    VStack(spacing:10) {
                        Image("WatchlistEmptyStatePlaceholder")
                        Text(LocalizedStringKey("watchlist-empty-state"))
                            .font(.headline)
                            .foregroundColor(.secondary)
                    }
                    .offset(y: UIScreen.main.bounds.height / 5.5)
                } else {
                    // MARK: - Bookmarked movies grid
                    LazyVGrid(
                        columns: [GridItem(.adaptive(minimum: 170), spacing: 14)],
                        spacing: 24
                    ) {
                        ForEach(Array(movie),id: \.self) { newRecord in
                            NavigationLink {
                                MovieDetails(movie: newRecord)
                            } label: { MovieCardGridItem(movie: newRecord) }
                            .foregroundColor(Color.white)
                        }
                    }
                    .padding()
                    //.padding(.horizontal)
                }
            }
            .searchable(text: $searchText)
            .navigationTitle(LocalizedStringKey("watchlist-tab-title"))
            .withBackground()
        }
        .navigationViewStyle(.stack)
    }
    
}

struct WatchlistTab_Previews: PreviewProvider {
    static var previews: some View {
        var wVM = WatchlistViewModel.shared
        WatchlistTab()
            .environmentObject(wVM)
        
    }
}
