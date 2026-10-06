//
//  NetworkManager.swift
//  MoviesApp
//
//  Created by riccardo ruocco on 21/02/22.
//

import Foundation

class NetworkManager{
    
    static var shared = NetworkManager()
    private var languageResult:String = "en"
    
    private init(){
        if let locale = Locale.current.languageCode {
            switch locale {
            case "it":
                setLanguage(language: .italian)
            case "de":
                setLanguage(language: .german)
            default:
                setLanguage(language: .englishUSA)
            }
            
        }
    }
    
    func setLanguage(language:LanguageType){
        if(language == LanguageType.englishUSA){
            languageResult = "en"
        }
        else if(language == LanguageType.german){
            languageResult = "de"
        }
        else if(language == LanguageType.italian){
            languageResult = "it"
        }
    }
    func getCurrentLanguage()->LanguageType{
        var currentLanguage:LanguageType? = nil
        if(self.languageResult == "en"){
            currentLanguage = LanguageType.englishUSA
        }
        else if(self.languageResult == "de"){
            currentLanguage = LanguageType.german
        }
        else if(self.languageResult == "it"){
            currentLanguage = LanguageType.italian
        }
        return currentLanguage!
    }
    
    
    func getProvidersById(id:Int64) async throws->ProviderResponse{
        
        var providerToReturn:ProviderResponse = ProviderResponse(id: nil, results: nil)
        var urlComponent = URLComponents(string: "https://api.themoviedb.org")!
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        urlComponent.path = "/3/movie/\(id)/watch/providers"
        urlComponent.queryItems = [
            "api_key": "fadf21998f46c545c3f3de23ca5712ec"
        ].map { URLQueryItem(name: $0.key, value: $0.value) }
        print(urlComponent.url!)
        do{
            let (data,response) = try await URLSession.shared.data(from: urlComponent.url!)
            
            if let httpResponse = response as? HTTPURLResponse,
               httpResponse.statusCode == 200,
               let provider = try? decoder.decode(ProviderResponse.self, from: data){
                providerToReturn = provider
            }
        }
        catch let DecodingError.dataCorrupted(context) {
            print(context)
        } catch let DecodingError.keyNotFound(key, context) {
            print("Key '\(key)' not found:", context.debugDescription)
            print("codingPath:", context.codingPath)
        } catch let DecodingError.valueNotFound(value, context) {
            print("Value '\(value)' not found:", context.debugDescription)
            print("codingPath:", context.codingPath)
        } catch let DecodingError.typeMismatch(type, context)  {
            print("Type '\(type)' mismatch:", context.debugDescription)
            print("codingPath:", context.codingPath)
        } catch {
            print("error: ", error)
        }
        
        return providerToReturn
    }
    
    
    func getMovieById(id:Int64) async throws -> Movie {
        var movieToReturn:Movie = Movie.example
        var urlComponent = URLComponents(string: "https://api.themoviedb.org")!
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        
        urlComponent.path = "/3/movie/\(id)"
        urlComponent.queryItems = [
            "api_key": "fadf21998f46c545c3f3de23ca5712ec",
            "language": "\(languageResult)"
        ].map { URLQueryItem(name: $0.key, value: $0.value) }
        do{
            let (data,response) = try await URLSession.shared.data(from: urlComponent.url!)
            if let httpResponse = response as? HTTPURLResponse,
               httpResponse.statusCode == 200,
               let movie = try? decoder.decode(Movie.self, from: data){
                movieToReturn = movie
            }
        }
        catch{
            throw DataException.ErrorGettingTheData
        }
        if(self.languageResult == "en"){
            movieToReturn.language = LanguageType.englishUSA
        }
        else if(self.languageResult == "de"){
            movieToReturn.language = LanguageType.german
            
        }
        else if(languageResult == "it"){
            movieToReturn.language = LanguageType.italian
            
        }
        
        return movieToReturn
        
    }
    
    func getCreditsById(id:Int64) async throws -> Credits? {
        var urlComponent = URLComponents(string: "https://api.themoviedb.org")!
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        urlComponent.path = "/3/movie/\(id)/credits"
        urlComponent.queryItems = [
            "api_key": "fadf21998f46c545c3f3de23ca5712ec",
            "language": "\(languageResult)"
        ].map { URLQueryItem(name: $0.key, value: $0.value) }
        
        do {
            let (data,response) = try await URLSession.shared.data(from: urlComponent.url!)
            if let httpResponse = response as? HTTPURLResponse,
               httpResponse.statusCode == 200,
               let movieCredits = try? decoder.decode(Credits.self, from: data) {
                return movieCredits
            }
        }
        
        catch{
            print(error)
            throw DataException.ErrorGettingTheData
        }
        
        return nil
        
    }
    
    enum HttpError: Error {
        case badURL, badResponse, errorDecodingData, invalidURL
    }
    
    
}



