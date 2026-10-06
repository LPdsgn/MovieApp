//
//  MovieStore.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 12/02/22.
//

import Foundation

class MovieAppModel {
    var allMovies:Array<Movie>
    static var shared = MovieAppModel()
    var networkManager = NetworkManager.shared
    var deepLinks:[String:String]
    
    
    
    private init(){
        allMovies = []
        deepLinks = ["Riccardo":"Lucia",]
    }
    
    func getMovieById(id:Int64) async throws-> Movie? {
        var movieToReturn = try await NetworkManager.shared.getMovieById(id: id)
        while(movieToReturn.id == Movie.example.id){
            movieToReturn = try await NetworkManager.shared.getMovieById(id: id)
        }
        
        allMovies.append(movieToReturn)
        return movieToReturn
    }
  
    
    
   
    
    private func getMovie(id:Int64) async throws->Movie{
        var movieToReturn:Movie? = nil
        movieToReturn = allMovies.first(where: {$0.id == id})
        if (movieToReturn == nil){
            movieToReturn = try await self.getMovieById(id: id)
        }
        return movieToReturn!
    }
    
    
    
    
    
   
    
    
    
  
}

struct WatchListModel{
    var alone:Set<Movie>
    var couple:Set<Movie>
    var friends:Set<Movie>
    var family:Set<Movie>
    var with:Company = Company.alone
    var movieAlreadyRecommended:Array<Movie>
    var savedMovies:Array<MovieToSave>
    
     init(){
        alone = []
        couple = []
        friends = []
        family = []
        savedMovies = CoreDataManager.shared.readMovie()
        movieAlreadyRecommended = []

    }
    @MainActor
    mutating func setWatchList()async throws{
        if(with == Company.alone){
            let movies = try await withThrowingTaskGroup(of: Movie?.self, returning: [Movie?].self){
                group in
                for aMovie in savedMovies{
                    if(aMovie.watchListItBelong == "alone"){
                        group.addTask{
                            return try await NetworkManager.shared.getMovieById(id: aMovie.id)
                        }
                    }
                }
                
                return try await group.reduce(into:[Movie?]()){
                    result,movie in
                    result.append(movie)
                }
            }
            for i in 0..<movies.count{
                if(movies[i] != nil){
                    movies[i]!.isSaved = true
                    alone.insert(movies[i]!)
//                    alone.append(movies[i]!)
                }
            }
        }
        
    }
    mutating func cleanHistory(){
        movieAlreadyRecommended.removeAll()
        
    }
    
    mutating func cleanWatchList(){
        self.alone = []
        for savedMovie in savedMovies{
            CoreDataManager.shared.deleteMovie(savedMovie)
        }
        self.savedMovies = []
    }
    
    
    
    mutating func addToMovieAlreadyReccomended(movieToSave:Movie){
        movieAlreadyRecommended.append(movieToSave)
    }
    func getMovieAlreadyRecommended()->Array<Movie>{
        return self.movieAlreadyRecommended
    }
    
    
    mutating func addToWatchList(_ movie:Movie){
        var movieToSave = MovieToSave(context: CoreDataManager.shared.persistentContainer.viewContext)
        movieToSave.id = movie.id
        if(with == Company.alone){
            movieToSave.watchListItBelong = "alone"
            if(!alone.contains(where: {$0.id == movie.id})){
                alone.insert(movie)
                savedMovies.append(movieToSave)
                CoreDataManager.shared.createMovie(movieToSave)
            }
        }
        else if(with == Company.couple){
            movieToSave.watchListItBelong = "couple"
//            self.couple.append(movie)
        }
        else if(with == Company.family){
            movieToSave.watchListItBelong = "family"
//            family.append(movie)
        }
        else if(with == Company.friends){
            movieToSave.watchListItBelong = "friends"
//            friends.append(movie)
        }
        
    }
    mutating func removeFromWatchList(_ movie:Movie){
        var theIndex:Int? = nil
        if(with == Company.alone){
            alone.remove(movie)
        }
        else if(with == Company.couple){
         
        }
        else if(with == Company.family){
            
        }
        else if(with == Company.friends){
       
        }
        for i in 0..<savedMovies.count{
            if(savedMovies[i].id == movie.id){
                theIndex = i
            }
        }
        if let unwrapped = theIndex{
            let savedToRemove = savedMovies.remove(at: unwrapped)
            CoreDataManager.shared.deleteMovie(savedToRemove)
        }
        
    }
    mutating func removeFromWatchList(_ movies:Array<Movie>){
        for aMovie in movies{
            aMovie.isSaved = false
            self.removeFromWatchList(aMovie)
        }
    }
    
    
    func getWatchList()->Set<Movie>{
        var watchListToReturn = Set<Movie>()
        
        if(with == Company.alone){
           
            watchListToReturn = self.alone
        }
        else if(with == Company.couple){
            watchListToReturn = self.couple
        }
        else if(with == Company.family){
            watchListToReturn = self.family
        }
        else if(with == Company.friends){
            watchListToReturn = self.friends
        }
        return watchListToReturn
    }
    
    func getWatchListId()->Array<Int64>{
        var idListToReturn:Array<Int64> = []
        for eachFilm in savedMovies{
            idListToReturn.append(eachFilm.id)
        }
        return idListToReturn
    }
    
    mutating func removeFromAlreadyRecommended(_ movie:Movie){
        self.movieAlreadyRecommended.remove(movie)
    }
    
}
