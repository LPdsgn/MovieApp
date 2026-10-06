//
//  Movie.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 12/02/22.
//

import Foundation


class Movie: Codable, Identifiable,Hashable {
    static func == (lhs: Movie, rhs: Movie) -> Bool {
        return lhs.id == rhs.id
    }
    
    func hash(into hasher: inout Hasher) {
            
    }
    func getLocalProviders()->CountryProviders?{
        var localProviders:CountryProviders? = nil
        if (self.language == LanguageType.englishUSA){
            if let provider = providers?.us{
                localProviders = self.providers!.us!
            }
        }
        else if(self.language == LanguageType.italian){
            if let provider = providers?.it{
                localProviders = self.providers!.it!
            }
        }
        else if(self.language == LanguageType.german){
            if let provider = providers?.de{
                localProviders = self.providers!.de!
            }
        }
        return localProviders
    }
    
    
    let id: Int64
    let posterPath: String?
    let backdropPath: String?
    let belongsToCollection: MovieCollection?
    let budget: Int
    let genres: Array<Genre>
    let homepage: String?
    let imdbId: String?
    let originalLanguage: String
    let originalTitle: String
    let overview: String
    let popularity: Float
    let productionCompanies: Array<ProductionCompany>
    let productionCountries: Array<ProductionCountry>
    let releaseDate: String
    let revenue: Int
    let runtime: Int?
    let spokenLanguages: Array<SpokenLanguage>
    let status: String
    let tagline: String
    let title: String
    let video: Bool
    let voteAverage: Float
    let voteCount: Int
//     let keywords: Array<Keyword>
     var providers: Providers? = Providers(de: nil, it: nil, us: nil)
    var credits: Credits? = nil
    var vote:Float? = nil
    var isSaved:Bool? = nil
    var language:LanguageType? = nil
     static let example = Movie()
    
    
    init(){
        self.id = 634649
        self.posterPath = "/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg"
        self.backdropPath = "/iQFcwSGbZXMkeyKrxbPnwnRo5fl.jpg"
        self.belongsToCollection = nil
        self.budget = 200000000
        self.genres = []
        self.homepage = "https://www.spidermannowayhome.movie"
        self.imdbId = "tt10872600"
        self.originalLanguage = "en"
        self.originalTitle = "Spider-Man: No Way Home"
        self.overview = "Peter Parker is unmasked and no longer able to separate his normal life from the high-stakes of being a super-hero. When he asks for help from Doctor Strange the stakes become even more dangerous, forcing him to discover what it truly means to be Spider-Man."
        self.popularity = 11286.376
        self.productionCompanies = []
        self.productionCountries = []
        self.releaseDate = "2021-12-15"
        self.revenue = 1775000000
        self.runtime = 148
        self.spokenLanguages = []
        self.status = "Released"
        self.tagline = "The Multiverse unleashed."
        self.title = "Spider-Man: No Way Home"
        self.video = false
        self.voteAverage = 8.4
        self.voteCount = 7443
        
    }

    var formattedDuration: String {
        guard let movieRuntime = self.runtime else { return "-" }
        let hours = Int(movieRuntime / 60)
        let minutes = movieRuntime % 60
        return "\(hours)h\(minutes)m"
    }
    
    var year: String {
        self.releaseDate.components(separatedBy: "-")[0]
    }
}


struct MovieCollection: Codable {
    let id: Int
    let name: String
    let posterPath: String
    let backdropPath: String
    
}


// MARK: - Genre
struct Genre: Codable, Identifiable {
    let id: Int
    let name: String
}

// MARK: - ProductionCompany
struct ProductionCompany: Codable, Identifiable {
    let id: Int
    let logoPath: String?
    let name: String
    let originCountry: String
}

// MARK: - ProductionCountry
struct ProductionCountry: Codable {
    let iso31661: String
    let name: String
}

// MARK: - SpokenLanguage
struct SpokenLanguage: Codable {
    let englishName: String
    let iso6391: String
    let name: String
}

// MARK: - Keyword
struct Keyword: Codable, Identifiable {
    let id: Int
    let name: String
}
// MARK: - ProviderResponse
struct ProviderResponse: Codable {
    let id: Int?
    let results: Providers?
}

// MARK: - Providers
struct Providers: Codable {
    let de: CountryProviders?
    let it: CountryProviders?
    let us: CountryProviders?
    
    
    
    
    func getAllMoovieProvider()->Set<MoovieProvider>{
        var allMoovieProvider:Set<MoovieProvider> = []
        
        if let notNullDe = de{
            for aDeProvider in notNullDe.getAllMooovieProvider(){
                allMoovieProvider.insert(aDeProvider)
            }
        }
        if let notNullIt = it{
            for aItProvider in notNullIt.getAllMooovieProvider(){
                allMoovieProvider.insert(aItProvider)
            }
        }
        if let notNullUs = us{
            for aUsProvider in notNullUs.getAllMooovieProvider(){
                allMoovieProvider.insert(aUsProvider)
            }
        }
        return allMoovieProvider
    }
    enum CodingKeys: String, CodingKey {
        case de = "DE"
        case it = "IT"
        case us = "US"
    }
}

// MARK: - CountryProviders
struct CountryProviders: Codable {
    
    func getAllMooovieProvider()->Set<MoovieProvider>{
        var allMoovieProvider:Set<MoovieProvider> = []
        if let notNullRent = self.rent{
            for aRent in notNullRent{
                allMoovieProvider.insert(aRent)
            }
        }
        if let notNullBuy = self.buy{
            for aBuy in notNullBuy{
                allMoovieProvider.insert(aBuy)
            }
        }
        if let notNullFlatrate = self.flatrate{
            for aFlatRate in notNullFlatrate{
                allMoovieProvider.insert(aFlatRate)
            }
        }
        return allMoovieProvider
    }
    
    let link: String
    let rent: Array<MoovieProvider>?
    let buy: Array<MoovieProvider>?
    let flatrate: Array<MoovieProvider>?
}

// MARK: - MoovieProvider
struct MoovieProvider: Codable,Identifiable,Hashable {
    let id = UUID()
    let displayPriority: Int
    let logoPath: String
    let providerId: Int
    let providerName: String
    var providerLink:String? = nil
}

enum Company{
    case alone
    case couple
    case friends
    case family
}

struct shortMovie:Codable{
    var id:Int?
    var name:String?
}

enum LanguageType: Codable{
    case englishUSA
    case german
    case italian
}
