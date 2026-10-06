//
//  CoreDataManager.swift
//  MoviesApp
//
//  Created by riccardo ruocco on 24/02/22.
//


import Foundation
import CoreData

class CoreDataManager {
    static let shared = CoreDataManager()
    let persistentContainer: NSPersistentContainer

    
    private init() {
        persistentContainer = NSPersistentContainer(name: "CoreDataModel")
        persistentContainer.loadPersistentStores{ (description,error) in
            if let error = error {
                fatalError("Core Data Store failed \(error.localizedDescription)")
            }
        }
    }
    
    func save(){
        do{
            try persistentContainer.viewContext.save()
        }
        catch{
            persistentContainer.viewContext.rollback()
        }
    }
    
    func saveContext(){
        let context = persistentContainer.viewContext
        if context.hasChanges{
            do {
                try context.save()
            }
            catch {
                
            }
        }
    }
    
    //    MARK: - CRUD(Movie)
    func createMovie(_ movie:MovieToSave){
        save()

    }
    
    func readMovie()->Array<MovieToSave>{
        let fetchRequest:NSFetchRequest<MovieToSave> = MovieToSave.fetchRequest()
//        fetchRequest.predicate =  NSPredicate(format: "name == %@", query)

        var result:Array<MovieToSave> = []
        do{
            result = try persistentContainer.viewContext.fetch(fetchRequest)
        }
        catch{
            
        }
        return result
    }
    
    func readMovieAlone()->Array<MovieToSave>{
        let fetchRequest:NSFetchRequest<MovieToSave> = MovieToSave.fetchRequest()
        var query = "alone"
        fetchRequest.predicate = NSPredicate(format: "watchListItBelong == %@", query)
    
        var result:Array<MovieToSave> = []
        do{
            result = try persistentContainer.viewContext.fetch(fetchRequest)
        }
        catch{
            
        }
        return result
    }
    
    func updateMovie(_ movie:MovieToSave){
        save()
    }
 
    func deleteMovie(_ movie:MovieToSave){
        persistentContainer.viewContext.delete(movie)

    }

    

    
}
