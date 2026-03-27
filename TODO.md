 





MySQL (The Relational "Equivalence Group" Approach) 

Instead of linking FORI001 directly to FORI002, and FORI002 to FORI003 (which creates a messy chain that is hard to query), you assign them all the same abstract equivalence_id. 

1. The Table Structure 

You only really need one table for the courses, plus an internal group ID. 

SQL 

CREATE TABLE Asignaturas ( 
    code VARCHAR(10) PRIMARY KEY, 
    name VARCHAR(100) NOT NULL, 
    equivalence_id INT NOT NULL 
); 
 

2. Inserting the Data 

Notice how they all share the exact same equivalence_id (e.g., 105). The database doesn't care that the name changed; it only cares that the ID matches. 

SQL 

INSERT INTO Asignaturas (code, name, equivalence_id) VALUES  
('FORI001', 'Mecanica', 105), 
('FORI002', 'Mecanica', 105), 
('FORI003', 'Fisica', 105); 
 

3. The Query (How to search) 

If a user inputs FORI003, you want to find all other courses that share its equivalence_id. You can do this with a simple subquery: 

SQL 

SELECT code, name  
FROM Asignaturas  
WHERE equivalence_id = ( 
    SELECT equivalence_id  
    FROM Asignaturas  
    WHERE code = 'FORI003' 
) 
AND code != 'FORI003'; -- Optional: Excludes the input code from the results 
 

Why this is great: If FORI004 is created tomorrow, you just insert it with equivalence_id = 105. You don't have to update any of the older records. 