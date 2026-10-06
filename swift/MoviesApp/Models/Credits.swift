//
//  Credits.swift
//  MoviesApp
//
//  Created by Carmine Porricelli on 07/03/22.
//

import Foundation

struct Credits: Codable, Identifiable {
    let id: Int
    let cast: Array<CastMember>
    let crew: Array<CrewMember>
}


struct CastMember: Codable, Identifiable {
    let adult: Bool
    let gender: Int8?
    let id: Int
    let knownForDepartment: String
    let name: String
    let originalName: String
    let profilePath: String?
    let castId: Int
    let character: String
    let creditId: String
    let order: Int
}

struct CrewMember: Codable, Identifiable {
    let adult: Bool
    let gender: Int8?
    let id: Int
    let knownForDepartment: String
    let name: String
    let originalName: String
    let profilePath: String?
    let creditId: String
    let department: String
    let job: String
}
