//
//  AppLanguage.swift
//  MoviesApp
//
//  Created by Luca Basile on 22/02/22.
//

import SwiftUI


struct Display: View {
    
    // MARK: - Localized string
    let languagesSectionTitle = LocalizedStringKey("select-language-title")
    let originalTitlesLanguageText = LocalizedStringKey("original-titles-language-text")
    let originalTitlesLanguageTextTitle = LocalizedStringKey("original-titles-language-text-title")
    
    //let languages = ["English", "Italian", "German"]
    let languages = [
        Language(locale: "en", key: "language-english"),
        Language(locale: "ge", key: "language-german"),
        Language(locale: "it", key: "language-italian")
    ]
    
    @State private var selectedLanguage = "en"
    
    
    var body: some View {
        List {
            Section(header: sectionHeader(label: languagesSectionTitle)) {
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
                }.listRowBackground(Color.clear)
            }
            Section(header: sectionHeader(label: originalTitlesLanguageTextTitle)) {
                Toggle(isOn: /*@START_MENU_TOKEN@*//*@PLACEHOLDER=Is On@*/.constant(true)/*@END_MENU_TOKEN@*/) {
                    Text(originalTitlesLanguageText)
                }
            }
            .listRowBackground(Color.clear)
            .listRowSeparator(.hidden)
        }
        .padding(.vertical)
        .listStyle(.plain)
        .withBackground()
        
        .navigationTitle("Display")
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
    
    // MARK: - Function
    private func sectionHeader(label: LocalizedStringKey) -> some View {
        Text(label)
            .font(.callout.weight(.medium))
            .foregroundColor(.accentColor)
            .textCase(.uppercase)
            .hLeading()
    }
    
}

struct AppLanguage_Previews: PreviewProvider {
    static var previews: some View {
        Display()
    }
}
