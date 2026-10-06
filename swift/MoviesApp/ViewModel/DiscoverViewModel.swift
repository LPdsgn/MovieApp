//
//  DiscoverViewModel.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 14/02/22.
//

import Foundation
import SwiftUI
import ModelIO


class DiscoverViewModel: ObservableObject {
    @Published var movieCards: Array<MovieCard> = []
    @Published var model: MovieAppModel = MovieAppModel.shared
    @Published var networkingManager = NetworkManager.shared
    @Published var uiImage: UIImage?
    var advisor: GrandAdvisor = GrandAdvisor.shared
    
    var cardSetted: Bool = false
    var carLoading: Bool = false
    
    
    init() {
        let isAdvisorSetted = advisor.isAdvisorSetted
        if(isAdvisorSetted == false){
            let watchListId = WatchlistViewModel.shared.getWatchListId()
            
            var initialValues:[Int64:Double] = [:]
            for id in watchListId {
                initialValues[id] = 1.0
            }
            advisor.setAdvisor(initialValues: initialValues)
        }
        
        
        
        Task{
            do{
                try await self.setCards()
            }
            catch{
                
            }
        }
    }
    func setLanguage(language:LanguageType){
        NetworkManager.shared.setLanguage(language: language)
    }
    
    @MainActor
    func setCards() async throws{
        let movies = try await withThrowingTaskGroup(of: Movie?.self, returning: [Movie?].self){
            group in
            for _ in 0..<Constants.NumOfCards{
                let idAdvice = advisor.getAdvice()
                group.addTask{
                    return try await self.getAdviceByID(idAdvice: idAdvice)
                }
            }
            
            return try await group.reduce(into:[Movie?]()){
                result,movie in
                result.append(movie)
            }
        }
        for i in 0..<Constants.NumOfCards{
            if let unwrappedMovie = movies[i]{
                movieCards.append(MovieCard(movie: unwrappedMovie))
            }
        }
        cardSetted = true
        
    }
    
    
    
    func isCardsSetted()->Bool{
        return self.cardSetted
    }
    func isCardsLoading()->Bool{
        return self.carLoading
    }
    func setCardsLoading(_ value:Bool){
        carLoading = value
    }
    @MainActor
    func nextCard() async throws->MovieCard{
        var removedCard:MovieCard? = nil
        if(movieCards.count >= 3){
            removedCard = movieCards.removeLast()
            var movieRemoved = removedCard!.movie
            //            self.giveFeedback(drawValueId: movieRemoved.id, result: voto)
            //            self.addToMovieAlreadyReccomended(movieToSave: movieRemoved, voteOfTheMovie: Float(voto))
            let advice = try await self.getAdvice()
            if let notNullAdvice = advice {
                if (notNullAdvice.id != Movie.example.id){
                    movieCards.insert(MovieCard(movie: notNullAdvice), at: 0)
                }
            }
        }
        else if(movieCards.count < 3){
            let advice = try await self.getAdvice()
            removedCard = movieCards.removeLast()
            var movieRemoved = removedCard!.movie
            //            self.giveFeedback(drawValueId: movieRemoved.id, result: voto)
            //            self.addToMovieAlreadyReccomended(movieToSave: movieRemoved, voteOfTheMovie: Float(voto))
            if let notNullAdvice = advice {
                if (notNullAdvice.id != Movie.example.id){
                    movieCards.insert(MovieCard(movie: notNullAdvice), at: 0)
                }
            }
        }
        return removedCard!
    }
    func getProviders(movie:Movie) async throws{
        if let providersNotNull = movie.providers{
            var arrayOfUniqueProviders = Array(providersNotNull.getAllMoovieProvider())
                  let providersImage = try await withThrowingTaskGroup(of: Void.self){ group in
                      for aProvider in arrayOfUniqueProviders{
                          let url = URL(string: Constants.ImagesBasePath + aProvider.logoPath)
                          group.addTask {
                              try await self.fetchImage(url)
                          }
                      }
                      try await group
            }
        }
    }
    func resetModel(){
        advisor.resetAdvisor()
    }
    
    
    // MARK: Riccardo Function
    
    func getAdviceByID(idAdvice:Int64) async throws-> Movie?{
        
        async let downloadedMovie = try self.getMovieById(id: idAdvice)
        async let providersOfTheMovie = try self.getProvidersById(id: idAdvice)
        async let creditsOfTheMovie = try self.getCreditsById(id: idAdvice)
        
        let (adviceToReturn, elemento, credits) = try await (downloadedMovie, providersOfTheMovie, creditsOfTheMovie)
        adviceToReturn?.providers = elemento
        adviceToReturn?.credits = credits
        let posterPath = URL(string: Constants.ImagesBasePath + (adviceToReturn?.posterPath!)!)
        Task(priority:.high){
            try await self.fetchImage(posterPath)
        }
 
        adviceToReturn?.isSaved = false
        return adviceToReturn
    }
    
    
    
    func getAdvice() async throws -> Movie? {
        //        let isAdvisorSetted = advisor.isAdvisorSetted
        //        if(isAdvisorSetted == false){
        //            let watchListId = WatchlistViewModel.shared.getWatchListId()
        //            var initialValues:[Int64:Double] = [:]
        //            for id in watchListId {
        //                initialValues[id] = 1.0
        //            }
        //            advisor.setAdvisor(initialValues: initialValues)
        //        }
        let idAdvice = advisor.getAdvice()
        
        
        async let downloadedMovie = try self.getMovieById(id: idAdvice)
        async let providersOfTheMovie = try self.getProvidersById(id: idAdvice)
        async let creditsOfTheMovie = try self.getCreditsById(id: idAdvice)
        
        let (adviceToReturn, elemento, credits) = try await (downloadedMovie, providersOfTheMovie, creditsOfTheMovie)
        adviceToReturn?.providers = elemento
        adviceToReturn?.credits = credits
        if(adviceToReturn?.posterPath != nil){
            let posterPath = URL(string: Constants.ImagesBasePath + (adviceToReturn?.posterPath!)!)
            Task(priority:.high){
                try await self.fetchImage(posterPath)
            }
        }
        
//        if let providersWichImageINeed = elemento{
//            var arrayOfUniqueProviders = Array(elemento!.getAllMoovieProvider())
//            let providersImage = try await withThrowingTaskGroup(of: Void.self){ group in
//                for aProvider in arrayOfUniqueProviders{
//                    let url = URL(string: Constants.ImagesBasePath + aProvider.logoPath)
//                    group.addTask {
//                        try await self.fetchImage(url)
//                    }
//                }
//                try await group
//            }
//        }
        
        
        adviceToReturn?.isSaved = false
        return adviceToReturn
    }
    
    @MainActor
    func fetchImage(_ url: URL?) async throws {
        
        guard let url = url else {
            throw NetworkError.badUrl
        }
        
        let request = URLRequest(url: url)
        
        
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
                  throw NetworkError.badRequest
              }
        
        guard let image = UIImage(data: data) else {
            throw NetworkError.unsupportedImage
        }
        
        // store it in the cache
        ImageCache[url.absoluteString] = image
        uiImage = image
        
    }
    
    
    
    func getProvidersById(id:Int64) async throws -> Providers?{
        return try await networkingManager.getProvidersById(id: id).results
    }
    
    func getCreditsById(id:Int64) async throws -> Credits? {
        return try await networkingManager.getCreditsById(id: id)
    }
    
    func giveFeedback(drawValueId:Int64,result:Double){
        advisor.giveFeedback(drawValueId: drawValueId, result: result)
    }
    
    func getMovieById(id:Int64) async throws-> Movie? {
        return try await model.getMovieById(id: id)
    }
    
    func addToMovieAlreadyReccomended(movieToSave:Movie,voteOfTheMovie:Float){
        movieToSave.vote = voteOfTheMovie
        WatchlistViewModel.shared.addToMovieAlreadyReccomended(movieToSave)
    }
    
    func discardMovie() {
        
        // Remove discarded movie's poster image from cache
        if let posterPath = movieCards.last?.movie.posterPath {
            ImageCache.removeImageFromCache(with: Constants.ImagesBasePath + posterPath)
        }
        Haptics.shared.play(.soft)
        withAnimation {
            DispatchQueue.main.asyncAfter(deadline: .now() + Constants.swipeAnimationSpeed) {
                Task{
                    do {
                        let card = try await self.nextCard()
                        self.giveFeedback(drawValueId: card.movie.id, result: -1.0)
                        self.addToMovieAlreadyReccomended(movieToSave: card.movie, voteOfTheMovie: -1.0)
                        
                        withAnimation {
                            self.movieCards[self.movieCards.last!].rotationDegree = 0
                        }
                    }
                    catch{
                        print("Errore caricamento dati")
                    }
                }
            }
        }
    }
    
    func makeMovieFavorite() {
        withAnimation {
            Haptics.shared.play(.heavy)
            
            DispatchQueue.main.asyncAfter(deadline: .now() + Constants.swipeAnimationSpeed) {
                Task {
                    do{
                        let card = try await self.nextCard()
                        self.giveFeedback(drawValueId: card.movie.id, result: 1.0)
                        self.addToMovieAlreadyReccomended(movieToSave: card.movie, voteOfTheMovie: 1.0)
                        withAnimation {
                            self.movieCards[self.movieCards.last!].rotationDegree = 0
                        }
                    }
                    catch{
                        print("Errore dati")
                    }
                }
            }
        }
    }
    func swipeToWatchList(){
        withAnimation {
            Haptics.shared.play(.heavy)
            
            DispatchQueue.main.asyncAfter(deadline: .now() + Constants.swipeAnimationSpeed) {
                Task {
                    do{
                        let card = try await self.nextCard()
                        self.giveFeedback(drawValueId: card.movie.id, result: 1.0)
                        card.movie.isSaved = true
                        WatchlistViewModel.shared.addToWatchList(card.movie)
                        withAnimation {
                            self.movieCards[self.movieCards.last!].rotationDegree = 0
                        }
                    }
                    catch{
                        print("Errore dati")
                    }
                }
            }
        }
        
    }
    
    
    
    
    func rotateCard(_ movieCard: MovieCard, degrees: Double) {
        movieCards[movieCard].rotationOffset = degrees
    }
    
    func moveCard(_ movieCard: MovieCard, offset: CGSize) {
        movieCards[movieCard].offset = offset
    }
    
    struct MovieCard: Identifiable {
        init(movie: Movie) {
            self.movie = movie
        }
        
        let id = UUID()
        var rotationDegree = Double(
            Int.random(in: -4...4)
        )
        let movie: Movie
        
        var offset: CGSize = .zero
        var rotationOffset: CGFloat = .zero
        
        
    }
}
