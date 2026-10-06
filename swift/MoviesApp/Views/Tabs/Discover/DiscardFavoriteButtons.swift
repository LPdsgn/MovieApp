//
//  DiscardFavoriteButtons.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 14/02/22.
//

import SwiftUI

struct DiscardFavoriteButtons: View {
    let makeFavorite: () -> Void
    let discard: () -> Void
    let addToBookmark: () -> Void
    
    
    var body: some View {
        HStack {
            // MARK: - Discard button
            Button(action: discard) {
                Image(systemName: "xmark")
                    .font(.title2.weight(.semibold))
                    .foregroundColor(.accentColor)
                
            }
            .buttonStyle(SkeumorphicButtonStyle(.secondary))
            .frame(width: 60, height: 60)
            // MARK: - Spacer
            Spacer()
            // MARK: - Bookmark button
            Button(action: addToBookmark) {
                Image(systemName: "bookmark.fill")
                    .font(.title.weight(.semibold))
                    .foregroundColor(.init("Gray-800"))
            }
            .buttonStyle(SkeumorphicButtonStyle(.primary))
            .frame(width: 75, height: 75)
            .padding(.top)
            // MARK: - Spacer
            Spacer()
            // MARK: - Like button
            Button(action: makeFavorite) {
                Image(systemName: "heart.fill")
                    .font(.title2.weight(.semibold))
                    .foregroundColor(.accentColor)
            }
            .buttonStyle(SkeumorphicButtonStyle(.secondary))
            .frame(width: 60, height: 60)
            
        }
        .padding()
        .padding(.horizontal)
    }
    
}

struct DiscardFavoriteButtons_Previews: PreviewProvider {
    static var previews: some View {
        DiscardFavoriteButtons(makeFavorite: {}, discard: {}, addToBookmark: {})
    }
}
