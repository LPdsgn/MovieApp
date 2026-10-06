//
//  MovieProviders.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 21/02/22.
//

import SwiftUI

struct MovieProviders: View {
    let providers: CountryProviders?
    @EnvironmentObject var viewModel: DiscoverViewModel

    
    init(_ providers: CountryProviders?, returnToPopCorn:(() -> Void)? = nil) {
        self.providers = providers
    }
    var returnToPopCorn:(()->Void)? = nil
    let movieProvidersTitle = LocalizedStringKey("movie-providers-title")
    @StateObject private var imageLoader = ImageLoaderViewModel()

    
    var body: some View {
        VStack(alignment: .leading) {
            
            
            if let flateRateProvider = providers?.flatrate{
                Text(movieProvidersTitle)
                    .font(.callout.smallCaps())
                    .foregroundStyle(.secondary)
                ScrollView(.horizontal){
                    HStack(spacing: 16) {
                        ForEach(providers!.flatrate!){ aProvider in
                            ProviderIcon(provider: aProvider)
                            
                        }
                    }
                }
            }
            
            if let rentProvider = providers?.rent{
                Text(LocalizedStringKey("available-to-buy"))
                    .font(.callout.smallCaps())
                    .foregroundStyle(.secondary)
                    .padding(.top)
                ScrollView(.horizontal){
                    HStack(spacing: 16) {
                            ForEach(providers!.rent!){ aProvider in
                                ProviderIcon(provider: aProvider)
                            }
                    }
                }
            }
            if let nuyRateProvider = providers?.buy{
                Text(LocalizedStringKey("available-to-rent"))
                    .font(.callout.smallCaps())
                    .foregroundStyle(.secondary)
                    .padding(.top)
                ScrollView(.horizontal){
                    HStack(spacing: 16) {
                        ForEach(providers!.buy!){ aProvider in
                            ProviderIcon(provider: aProvider)
                        }
                    }
                }
            }
        }
        .padding(.horizontal)
    }
    
    
    private func isMovieAvailableFor(_ provider: StreamingProvider) -> Bool {
        if let providers = providers {
            if let availableStreamingProviders = providers.flatrate {
                return availableStreamingProviders.contains { movieProvider in
                    movieProvider.providerId == provider.rawValue
                }
            }
        }
        
        return false
    }
}

fileprivate struct ProviderIcon: View {
//    let isActive: Bool;
    @EnvironmentObject var viewModel: DiscoverViewModel
    let provider: MoovieProvider;
//    var url:String? = nil
    var itunesItem:String? = nil
    var returnToPopCorn:(()->Void)? = nil
    
    var body: some View {
        
        Button(action: {
            print(Constants.ImagesBasePath + provider.logoPath)
        }, label: {
            
            if let url = URL(string: Constants.ImagesBasePath + provider.logoPath), let cachedImage = ImageCache[url.absoluteString] {
                Image(uiImage: cachedImage)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 45, height: 45)
                    .clipShape(Circle())
            }
            else if let uiImage = viewModel.uiImage {
                Image(uiImage: uiImage)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 45, height: 45)
                    .clipShape(Circle())
            
                
            } else {
                Image("placeholder")
                    .resizable()
                    .scaledToFill()
                    .frame(width: 45, height: 45)
                    .clipShape(Circle())
//                    .task {
//                        await downloadImage()
//                    }
            }
        })
        
        
     
        
    }
}

struct MovieProviders_Previews: PreviewProvider {
    static var previews: some View {
        MovieProviders(nil)
    }
}
