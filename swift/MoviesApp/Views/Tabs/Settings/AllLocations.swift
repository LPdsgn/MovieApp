//
//  AllLocations.swift
//  MoviesApp
//
//  Created by Luca Basile on 18/02/22.
//

import SwiftUI
import Foundation


struct AllLocations: View {
    
    let locations = ["United States", "United Kingdom", "Italy", "Germany"]
    @State private var selectedLocation = "United States"
    
    
    var body: some View {
        List {
            ForEach(locations,id: \.self) { location in
                HStack{
                    Text(location)
                    Spacer()
                    if selectedLocation == location {
                        Image(systemName: "checkmark")
                            .foregroundColor(.accentColor)
                    }
                }
                .listRowBackground(Color.clear)
                .contentShape(Rectangle())
                .onTapGesture {
                    selectedLocation = location
                }
                
            }
        }
        .padding(.top)
        .withBackground()
        .listStyle(.plain)
        .navigationTitle("select-country-title")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct AllLocations_Previews: PreviewProvider {
    static var previews: some View {
        AllLocations()
    }
}
