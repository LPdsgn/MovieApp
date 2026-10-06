//
//  CurrentLocation.swift
//  MoviesApp
//
//  Created by Luca Basile on 18/02/22.
//

import SwiftUI

struct CurrentLocation: View {
    
    init () {
        UITableView.appearance().backgroundColor=UIColor.clear
    }
    
    var locations = ["United States", "United Kingdom", "Italy", "Germany"]
        
    var body: some View {
        VStack{
            List {
                NavigationLink {
                    AllLocations()
                } label: {
                    HStack(){
                        Text("Country")
                        Spacer()
                        Text(locations[0])
                            .foregroundColor(.secondary)
                    }
                    
                } .listRowBackground(Color.clear)
                
                
                
            }.padding()
                .withBackground()
                .listRowBackground(Color.clear)
                .listStyle(.plain)
            
        }
        .navigationTitle("Current Location")
        .navigationBarTitleDisplayMode(.inline)
        
    }
    
    struct CurrentLocation_Previews: PreviewProvider {
        static var previews: some View {
            CurrentLocation()
        }
    }
}
