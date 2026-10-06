//
//  WatchlistViewModel.swift
//  MoviesApp
//
//  Created by Luigi Pedata on 16/02/22.
//

import Foundation
import StoreKit
class WatchlistViewModel: ObservableObject {
    @Published var model: WatchListModel = WatchListModel()
    static var shared = WatchlistViewModel()
    private init(){
        Task{
            do{
                try await model.setWatchList()

            }
            catch{
                
            }

        }
    }
    
    func addToMovieAlreadyReccomended(_ movie:Movie){
        model.addToMovieAlreadyReccomended(movieToSave: movie)
    }
    func removeFromAlreadyReccomended(_ movie:Movie){
        model.removeFromAlreadyRecommended(movie)
    }
    func cleanWatchList(){
        model.cleanWatchList()
    }
    func cleanHistory(){
        
        model.cleanHistory()
    }
    
    func removeFromWatchList(_ movies:Array<Movie>){
        model.removeFromWatchList(movies)
    }
    
    func getWatchListId()->Array<Int64>{
        return model.getWatchListId()
    }
    
    func addToWatchList(_ movie:Movie){
        model.addToWatchList(movie)
    }
    func removeFromWatchList(_ movie:Movie){
        model.removeFromWatchList(movie)
    }
    func getMovieAlreadyRecommended()->Array<Movie>{
        return model.getMovieAlreadyRecommended()
    }
    func getWatchList()->Set<Movie>{
        return model.getWatchList()
    }
    func openTheStore(itunesItem:String){
        
        
        var vc:SKStoreProductViewController = SKStoreProductViewController()
        let params = [SKStoreProductParameterITunesItemIdentifier:itunesItem] as [String : Any]
        vc.loadProduct(withParameters: params, completionBlock: { (success,error) -> Void in
            UIApplication.shared.windows.first?.rootViewController?.present(vc, animated: true, completion: nil)
        })
    }


}
