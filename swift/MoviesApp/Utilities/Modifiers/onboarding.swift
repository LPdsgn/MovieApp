//
//  onboarding.swift
//  MoviesApp
//
//  Created by Luigi Pedata on 28/02/22.
//

import SwiftUI

extension View{
    
    //MARK: - Custom Spotlight Modifier
    func spotlight(enabled: Bool, title: String = "")->some View{
        return self
            .overlay {
                if enabled{
                    SpotlightView(title: title) {
                        self
                    }
                }
            }
    }
    
    //MARK: Screen Bounds
    func screenBounds()->CGRect{
        return UIScreen.main.bounds
    }
    
    //MARK: Root Controller
    func rootController()->UIViewController{
        
    }
}

struct ContentView_Spotlight_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}

//MARK: - Spotlight View

struct SpotlightView<Content: View>: View {
    
    var content: Content
    
    var title: String
    
    init(title: String,@ViewBuilder content: @escaping ()->Content){
        self.content = content()
        self.title = title
    }
    
    var body: some View {
        Rectangle()
            .fill(.clear)
            .onAppear{
                addOverlayView()
            }
    }
    
    //MARK: Adding an extra view OVER the current view
    //By extracting the UIview from the Root Controller
    func addOverlayView(){
        
    }
}
