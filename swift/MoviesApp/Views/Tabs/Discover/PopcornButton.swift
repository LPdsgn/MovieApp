//
//  PopcornButton.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 22/02/22.
//

import SwiftUI
import SpriteKit

struct PopcornButton: View {
    
    let isLoading: Bool
    let action: () -> Void
        
    var particlesScene: SKScene {
        let scene = GameScene()
        scene.backgroundColor = .clear
        scene.size = CGSize(width: 300, height: 400)
        scene.scaleMode = .fill
        return scene
    }
    
    var body: some View {
        ZStack {
            Button(action: action) {
                ZStack {
                    Image("Popcorns")
                        .resizable()
                        .scaledToFill()
                    
                    //TODO: Implement
                    if false {
                        SpriteView(scene: particlesScene, options: [.allowsTransparency])
                            .frame(width: 252, height: 252)
                            .background(.clear)
                            .zIndex(999)

                    }
                }
            }
            .buttonStyle(SkeumorphicButtonStyle(.secondary, withHapticFeedback: .rigid))
            .frame(width: 252, height: 252)
        }

    }
}

// A simple game scene with falling boxes
class GameScene: SKScene {
    override func didMove(to view: SKView) {
        if let particles = SKEmitterNode(fileNamed: "PopcornPop.sks") {
            particles.position = CGPoint(x: size.width / 2,  y: 300)
            addChild(particles)
        }
    }
}

struct PopcornButton_Previews: PreviewProvider {
    static var previews: some View {
        PopcornButton(isLoading: true) {
            //
        }
    }
}
