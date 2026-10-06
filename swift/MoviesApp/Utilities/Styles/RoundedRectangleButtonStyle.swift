//
//  RoundedRectangleButtonStyle.swift
//  AirQuotes
//
//  Created by Carmine Porricelli on 31/01/22.
//

import SwiftUI


struct RoundedRectangleButtonStyle: ButtonStyle {
    
    let type: RoundedRectangleButtonStyleType
    
    init(_ type: RoundedRectangleButtonStyleType = .primary) {
        self.type = type
    }
    
    var isPrimary: Bool { type == .primary }
    
    func makeBody(configuration: Configuration) -> some View {
        HStack {
            Spacer()
            configuration
                .label
                .foregroundColor(isPrimary ? .black : .white)
            Spacer()
        }
        .padding()
        .foregroundColor(.black)
        .background(isPrimary ? Color.accentColor : Color("Gray-800"))
        .cornerRadius(Constants.CornerRadius)
        .scaleEffect(configuration.isPressed ? 0.95 : 1)
    }
    
    enum RoundedRectangleButtonStyleType {
        case primary, secondary
    }
}


struct RoundedRectangleButtonStyle_Previews: PreviewProvider {
    static var previews: some View {
        Button("Apply", action: {})
            .buttonStyle(RoundedRectangleButtonStyle())
        
        Button("Apply", action: {})
            .buttonStyle(RoundedRectangleButtonStyle(.secondary))
            .preferredColorScheme(.dark)

    }
}

