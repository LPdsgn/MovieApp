//
//  About.swift
//  MoviesApp
//
//  Created by Luigi Pedata on 07/03/22.
//

import SwiftUI
import UIKit
import MessageUI

struct About: View {
    
    @State var result: Result<MFMailComposeResult, Error>? = nil
       @State var isShowingMailView = false
    
    // MARK: - Localized string
    let aboutTabTitle = LocalizedStringKey("about-settings")
    let aboutText = LocalizedStringKey("about-text")
    let contributionsSectionTitle = LocalizedStringKey("contributions-section-title")
    let contactsSectionTitle = LocalizedStringKey("contact-section-title")
    let creditsTmdb = LocalizedStringKey("credits-tmdb")
    let creditsTeam = LocalizedStringKey("credits-team")
    
    var body: some View {
        List {
            Section {
                Text(aboutText)
                    .font(.title3)
                    .padding(.top)
            }
            .listRowBackground(Color.clear)
            .listRowSeparator(.hidden)
            Section(header: sectionHeader(label: contactsSectionTitle)) {
                Group {
                Button(action: {
                            self.isShowingMailView.toggle()
                        }) {
                            Text("Get in touch")
                                .font(.title3.smallCaps())
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth:.infinity)
                        .padding()
                        .foregroundColor(.black)
                        .background(Color("AccentColor"))
                        .cornerRadius(12)
                        .disabled(!MFMailComposeViewController.canSendMail())
                        .sheet(isPresented: $isShowingMailView) {
                            MailView(result: self.$result)
                        }
                }
                //.padding(.vertical)
            }
            .listRowBackground(Color.clear)
            .listRowSeparator(.hidden)
            Section(header: sectionHeader(label: contributionsSectionTitle)) {
                HStack(alignment: .bottom, spacing: 16) {
                    Image("TMDB-logo")
                        .resizable()
                        .scaledToFit()
                        .frame(maxWidth:100)
                    Text("This product uses the TMDb API but is not endorsed or certified by TMDb")
                }
                .padding(.vertical)
                VStack(alignment: .leading, spacing: 7) {
                    Text("MoovieFinder is brought to you by")
                    Text("Carmine Porricelli")
                        .fontWeight(.semibold)
                    Text("Riccardo F. Ruocco")
                        .fontWeight(.semibold)
                    Text("Luigi Pedata")
                        .fontWeight(.semibold)
                    Text("Luca Basile")
                        .fontWeight(.semibold)
                }
                .padding(.vertical)
            }
            .listRowBackground(Color.clear)
            //.listRowSeparator(.hidden)
        }
        .listStyle(.plain)
        .withBackground()
        .navigationTitle(aboutTabTitle)
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

struct About_Previews: PreviewProvider {
    static var previews: some View {
        About()
    }
}
