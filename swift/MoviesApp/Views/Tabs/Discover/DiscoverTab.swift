//
//  DiscoverTab.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 16/02/22.
//

import SwiftUI
import SpriteKit

struct DiscoverTab: View {
    @State private var isSwipeCardModalOpen: Bool = false
    @EnvironmentObject var discoverViewController: DiscoverViewModel
    
    //MARK: Localization strings
    let discoverTabTitle = LocalizedStringKey("discover-tab-title")
    let callToActionText = LocalizedStringKey("discover-call-to-action")

    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                
                PopcornButton(isLoading: true, action: popCornButtonTapped)
                    //.spotlight(enabled: true, title: "TAP")
                    .background(Pulse())
                
                Text(LocalizedStringKey("discover-call-to-action"))
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                
            }
            .navigationTitle(discoverTabTitle)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink {
                        DiscoverHistory()
                    } label: {
                        Image(systemName: "clock.arrow.circlepath")
                    }

                }
            }

            .fullScreenCover(isPresented: $isSwipeCardModalOpen, content: {
                MovieSwipe(isSwipeCardModalOpen: $isSwipeCardModalOpen)
            })
            .withBackground()
        }
        .navigationViewStyle(.stack)
    }
    
    
    
    // MARK: - Functions
    func popCornButtonTapped() {
        if((!discoverViewController.isCardsSetted())&&(!discoverViewController.isCardsLoading()))
        {
            discoverViewController.setCardsLoading(true)
            Task{
                do{
                    try await discoverViewController.setCards()
                    discoverViewController.setCardsLoading(false)
                    isSwipeCardModalOpen = true
                }
                catch{
                    print("Errore caricamento dati")
                }

            }
        }
        else{
            if(!discoverViewController.isCardsLoading()){
                isSwipeCardModalOpen = true

            }
        }
    }
    
}

struct DiscoverTab_Previews: PreviewProvider {
    static var previews: some View {
        DiscoverTab()
            .environmentObject(DiscoverViewModel())
    }
}

struct Pulse: View {
    @State var pulseAnimate = false
    
    var body: some View {
        ZStack {
            Circle().opacity(0.02).frame(width:636,height: 636)
                .scaleEffect(self.pulseAnimate ? 1: 0.8)
            Circle().opacity(0.02).frame(width:431,height: 431)
                .scaleEffect(self.pulseAnimate ? 1: 0.85)
            Circle().opacity(0.02).frame(width:323,height: 323)
                .scaleEffect(self.pulseAnimate ? 1: 0.9)
        }
        .onAppear {
            withAnimation(Animation.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                self.pulseAnimate.toggle()
            }
        }
    }
}
