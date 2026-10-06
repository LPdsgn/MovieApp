//
//  SettingsTab.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 14/02/22.
//

import SwiftUI
import UIKit

// MARK: - auto open main NavigationView as sidebar on iPad - utility code
/*struct UIKitShowSidebar: UIViewRepresentable {
  let showSidebar: Bool
  
  func makeUIView(context: Context) -> some UIView {
    let uiView = UIView()
    if self.showSidebar {
      DispatchQueue.main.async { [weak uiView] in
        uiView?.next(of: UISplitViewController.self)?
          .show(.primary)
      }
    } else {
      DispatchQueue.main.async { [weak uiView] in
        uiView?.next(of: UISplitViewController.self)?
          .show(.secondary)
      }
    }
    return uiView
  }
  
  func updateUIView(_ uiView: UIViewType, context: Context) {
    DispatchQueue.main.async { [weak uiView] in
      uiView?.next(
        of: UISplitViewController.self)?
        .show(showSidebar ? .primary : .secondary)
    }
  }
}

extension UIResponder {
  func next<T>(of type: T.Type) -> T? {
    guard let nextValue = self.next else {
      return nil
    }
    guard let result = nextValue as? T else {
      return nextValue.next(of: type.self)
    }
    return result
  }
}*/
// MARK: - End iPad sidebar utility code

struct SettingsTab: View {
    // MARK: - auto open main NavigationView as sidebar on iPad - Initial state
    //@State var showSidebar: Bool = false
    
    var locations = [
        "United States",
        "United Kingdom",
        "Italy",
        "Germany",
    ]
    
    // MARK: - Localized string
    let settigsTabTitle = LocalizedStringKey("settings-tab-title")
    let userSectionTitle = LocalizedStringKey("label-user-settings-section")
    let generalSectionTitle = LocalizedStringKey("label-general-settings-section")
    let currentLocationSettings = LocalizedStringKey("current-location-settings")
    let streamingPlatformSettings = LocalizedStringKey("streaming-platform-settings")
    let displaySettings = LocalizedStringKey("display-settings")
    let storageSettings = LocalizedStringKey("storage-settings")
    let aboutSettings = LocalizedStringKey("about-settings")

    
    var body: some View {
        NavigationView{
            VStack{
                VStack() {
                    List {
                        Group {
                            Section/*(header: sectionHeader(label: userSectionTitle))*/ {
                                /*NavigationLink { AllLocations() } label: {
                                    HStack {
                                        Text(currentLocationSettings)
                                        Spacer()
                                        Text(locations[0])
                                            .foregroundColor(.secondary)
                                    }
                                }*/
                                
                                NavigationLink { StreamingPlatforms() } label: {
                                    Text(streamingPlatformSettings)
                                }
                                NavigationLink {
                                    Storage()
                                } label: {
                                    Text(storageSettings)
                                }
                                NavigationLink {
                                    About()
                                } label: {
                                    Text(aboutSettings)
                                }
                                
                            }
                            
                            
                            /*Section(header: sectionHeader(label: generalSectionTitle)) {
                                /*NavigationLink {
                                    Display()
                                } label: {
                                    Text(displaySettings)
                                }*/
                                NavigationLink {
                                    Storage()
                                } label: {
                                    Text(storageSettings)
                                }
                                NavigationLink {
                                    About()
                                } label: {
                                    Text(aboutSettings)
                                }
                                
                            }*/
                        }
                        .listRowBackground(Color.clear)
                    }
                    //.withBackground()
                    .listRowBackground(Color.clear)
                    .listStyle(.plain)
                    
                }
            }
            .withBackground()
            .navigationTitle(settigsTabTitle)
            Spacer()
            // MARK: - auto open main NavigationView as sidebar on iPad
            /*if UIDevice.current.userInterfaceIdiom == .pad {
              UIKitShowSidebar(showSidebar: showSidebar)
                .frame(width: 0,height: 0)
                .onAppear {
                    showSidebar = true
                }
                .onDisappear {
                    showSidebar = false
                }
            }*/
        }
        .navigationViewStyle(.stack)
    }
    
    // MARK: - Function
    private func sectionHeader(label: LocalizedStringKey) -> some View {
        Text(label)
            .font(.callout.weight(.medium))
            .foregroundColor(.accentColor)
            .textCase(.uppercase)
            .hLeading()
    }
}

struct SettingsTab_Previews: PreviewProvider {
    static var previews: some View {
        SettingsTab()
    }
}
