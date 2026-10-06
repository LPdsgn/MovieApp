//
//  withBackground.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 25/02/22.
//

import SwiftUI

extension View {
    func withBackground(color: Color? = nil) -> some View {
        ZStack {
            if let color = color {
                color
            } else {
                Constants.AppBackground
                    .edgesIgnoringSafeArea(.all)
            }
            
            self
        }
    }
}
