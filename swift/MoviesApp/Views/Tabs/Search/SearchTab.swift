//
//  SearchTab.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 28/02/22.
//

import SwiftUI

struct SearchTab: View {
    @State private var searchText = ""
    
    init () {
        UITableView.appearance().backgroundColor=UIColor.clear
    }
    
    var body: some View {
        
        NavigationView{
            VStack{
                List{
                    MovieResultListItem(movie: Movie.example)
                        .listRowBackground(Color.clear)
                    MovieResultListItem(movie: Movie.example)
                        .listRowBackground(Color.clear)
                    MovieResultListItem(movie: Movie.example)
                        .listRowBackground(Color.clear)
                    MovieResultListItem(movie: Movie.example)
                        .listRowBackground(Color.clear)
                    MovieResultListItem(movie: Movie.example)
                        .listRowBackground(Color.clear)
                    MovieResultListItem(movie: Movie.example)
                        .listRowBackground(Color.clear)
                }
                .listStyle(.plain)
                .navigationTitle("Search")
                .navigationBarTitleDisplayMode(.inline)
                .withBackground()
                
                .searchable(text: $searchText)
            }
        }
        
        
    }
}

struct SearchTab_Previews: PreviewProvider {
    static var previews: some View {
        SearchTab()
    }
}
