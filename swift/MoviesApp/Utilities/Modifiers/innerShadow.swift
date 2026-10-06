//
//  innerShadow.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 25/02/22.
//

import SwiftUI

extension View {
    func innerShadow<S: Shape>(
        using shape: S,
        angle: Angle = .degrees(0),
        color: Color = .black,
        width: CGFloat = 6,
        offsetX: CGFloat = 0,
        offsetY: CGFloat = 0,
        blur: CGFloat = 4
    ) -> some View {
        
        let finalX = CGFloat(cos(angle.radians - .pi/2))
        let finalY = CGFloat(sin(angle.radians - .pi/2))
        
        return self
            .overlay(
                shape
                    .stroke(color, lineWidth: width)
                    .offset(x: finalX * width * offsetX, y: finalY * width * offsetY)
                    .blur(radius: blur)
                    .mask(shape)
            )
        
    }
}


