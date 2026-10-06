//
//  StreamingPlatforms.swift
//  MoviesApp
//
//  Created by Luca Basile on 22/02/22.
//

import SwiftUI

struct StreamingPlatforms: View {
    
    let platforms = ["Netflix", "Prime Video", "Disney+", "Apple TV+"]
    @State private var selectedPlatforms = ["Netflix", "Prime Video", "Disney+", "Apple TV+"]
    
    var body: some View {
        List{
            ForEach(platforms, id: \.self) { platform in
                HStack{
                    Text(platform)
                    Spacer()
                    if selectedPlatforms.contains(platform) {
                        Image(systemName: "checkmark")
                            .foregroundColor(.accentColor)
                    }
                    
                }
                .listRowBackground(Color.clear)
                .contentShape(Rectangle())
                .onTapGesture {
                    /*Controllare se è selezionato un elemento dell'array oppure no
                     se non è selezionato, posso selezionarlo e se non è selezionato posso deselezionarlo*/
                    if selectedPlatforms.contains(platform) {  //controlla se
                        if let indexPlatform = selectedPlatforms.firstIndex(of: platform) {
                            selectedPlatforms.remove(at: indexPlatform)
                        }  //controlla l'indice della piattaforma non selezionata
                        
                    }
                    else {
                        selectedPlatforms.append(platform)
                    }
                }
            }
        }   .padding(.top)
            .withBackground()
            .listStyle(.plain)
            .navigationTitle("streaming-platform-settings")
                .navigationBarTitleDisplayMode(.inline)
    }
}

struct StreamingPlatforms_Previews: PreviewProvider {
    static var previews: some View {
        StreamingPlatforms()
    }
}
