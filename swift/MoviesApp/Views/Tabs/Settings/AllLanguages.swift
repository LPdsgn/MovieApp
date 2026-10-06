//
//  AllLanguages.swift
//  MoviesApp
//
//  Created by Luca Basile on 22/02/22.
//

import SwiftUI

struct AllLanguages: View {
    
    let languages = [
        Language(locale: "en", key: "language-english"),
        Language(locale: "ge", key: "language-german"),
        Language(locale: "it", key: "language-italian")
    ]
    
    @State private var selectedLanguage = "en"
    
    
    var body: some View {
        List {
            ForEach(languages) { language in
                HStack{
                    Text(language.localizedString)
                    Spacer()
                    if selectedLanguage == language.locale {
                        Image(systemName: "checkmark")
                            .foregroundColor(.accentColor)
                    }
                }
                .listRowBackground(Color.clear)
                .contentShape(Rectangle())
                .onTapGesture {
                    selectedLanguage = language.locale
                }
                
            }
        }
        .padding(.vertical)
        .withBackground()
        .listStyle(.plain)
        .navigationTitle(LocalizedStringKey("select-language-title"))
        .navigationBarTitleDisplayMode(.inline)
    }
    
    
    struct Language: Identifiable {
        let id = UUID()
        let locale: String
        let key: String
        
        var localizedString: LocalizedStringKey {
            LocalizedStringKey(self.key)
        }
    }
}

struct AllLanguages_Previews: PreviewProvider {
    static var previews: some View {
        AllLanguages()
    }
}
