//
//  ViewAlignment.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 25/02/22.
//

import SwiftUI

extension View {
    /**
     - Returns: View horizontally aligned to the leading edge.
     */
    func hLeading() -> some View {
        self
            .frame(maxWidth: .infinity, alignment: .leading)
    }
    
    /**
     - Returns: View horizontally centered.
     */
    func hCenter() -> some View {
        self
            .frame(maxWidth: .infinity, alignment: .center)
    }
    
    /**
     - Returns: View horizontally aligned to the trailing edge.
     */
    func hTrailing() -> some View {
        self
            .frame(maxWidth: .infinity, alignment: .trailing)
    }
    
    /**
     - Returns: View vertically centered.
     */
    func vCenter() -> some View {
        self
            .frame(maxHeight: .infinity, alignment: .center)
    }
    
    /**
     - Returns: View vertically aligned to the leading edge.
     */
    func vLeading() -> some View {
        self
            .frame(maxHeight: .infinity, alignment: .leading)
    }
}
