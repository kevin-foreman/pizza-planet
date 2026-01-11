import React,{createContext,useContext,useEffect,useState} from 'react'

const AuthContext=createContext(null)
const KEY='pizzaPlanet.auth.v1'

export function AuthProvider({children}){
	const [user,setUser]=useState(()=>{
		try{
			const raw=localStorage.getItem(KEY)
			return raw?JSON.parse(raw):null
		}catch(e){
			return null
		}
	})

	function login(role){
		const next={name:'Benji',role}
		setUser(next)
		localStorage.setItem(KEY,JSON.stringify(next))
	}

	function logout(){
		setUser(null)
		localStorage.removeItem(KEY)
	}

	return(
		<AuthContext.Provider value={{user,login,logout}}>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth(){
	return useContext(AuthContext)
}
