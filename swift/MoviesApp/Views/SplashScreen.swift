//
//  SplashScreen.swift
//  MoviesApp
//
//  Created by Luigi Pedata on 03/03/22.
//

import SwiftUI

struct SplashScreen: View {
    
    // 1.
    @State var isActive:Bool = false
    
    var body: some View {
        VStack {
            // 2.
            if self.isActive {
                // 3.
                ContentView()
            } else {
                // 4.
                Image("camera")
            }
        }
        // 5.
        .onAppear {
            // 6.
            DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                // 7.
                withAnimation {
                    self.isActive = true
                }
            }
        }
        .withBackground()
    }
    
    
}

struct SplashScreen_Previews: PreviewProvider {
    static var previews: some View {
        SplashScreen()
    }
}

