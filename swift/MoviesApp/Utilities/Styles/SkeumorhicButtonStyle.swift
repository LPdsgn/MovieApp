//
//  SkeumorhicButtonStyle.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 16/02/22.
//

import SwiftUI

struct SkeumorphicButtonStyle: ButtonStyle {
    
    let type: SkeumorphicButtonStyleType
    let withHapticFeedback: UIImpactFeedbackGenerator.FeedbackStyle?
    
    
    init(_ type: SkeumorphicButtonStyleType = .primary, withHapticFeedback: UIImpactFeedbackGenerator.FeedbackStyle? = nil) {
        self.type = type
        self.withHapticFeedback = withHapticFeedback
    }
    
    var isPrimary: Bool { type == .primary }
    
    func makeBody(configuration: Configuration) -> some View {
        Circle()
            .fill(isPrimary ? .accentColor : Color("Gray-700"))
            .shadow(color: .black.opacity(0.2), radius: configuration.isPressed ? 0 : 5, x: 0, y: configuration.isPressed ? 0 : 5)
            .overlay {
                configuration.label
                    .font(.title.weight(.semibold))
                    .foregroundColor(isPrimary ? .init("Gray-800") : .accentColor)
            }
            .innerShadow(
                using: Circle(),
                angle: .degrees(180),
                color: .white,
                width: 0.3,
                offsetY: 3.5,
                blur: 0.6
            )
            .scaleEffect(configuration.isPressed ? 0.95 : 1)
            .onChange(of: configuration.isPressed) { newValue in
                if newValue {
                    if let hapticFeedbackType = withHapticFeedback {
                        Haptics.shared.play(hapticFeedbackType)
                    }
                }
            }
    }
    
    enum SkeumorphicButtonStyleType {
        case primary, secondary
    }
}


struct SkeumorphicButtonStyle_Previews: PreviewProvider {
    static var previews: some View {
        HStack {
            Button {
                print("")
            } label: {
                Image(systemName: "questionmark")
            }
            .buttonStyle(SkeumorphicButtonStyle())
            .frame(width: 75, height: 75)
            
            Button {
                print("")
            } label: {
                Image(systemName: "questionmark")
            }
            .buttonStyle(SkeumorphicButtonStyle(.secondary))
            .frame(width: 75, height: 75)
        }
        .withBackground()
    }
}


