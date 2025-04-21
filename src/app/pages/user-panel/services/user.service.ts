import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://127.0.0.1:8000/users/profile/'; // CREAR ENDPOINT EN EL BACK!!!!
  private logoutUrl = 'http://127.0.0.1:8000/logout'; 
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();
  private hasFetched = false;

  constructor(private http: HttpClient) {}

  getUserProfile(): Observable<User> {
    if (this.hasFetched && this.userSubject.value) {
      return of(this.userSubject.value);
    }

    this.hasFetched = true;
    return this.http.get<User>(this.apiUrl).pipe(
      tap((userData) => this.userSubject.next(userData)),
      catchError((error) => {
        console.error('Error fetching user profile:', error);
        this.hasFetched = false;
        throw error;
      })
    );
  }

  logout(): Observable<any> {
    return this.http.delete(this.logoutUrl, { withCredentials: true }).pipe(
      tap(() => {
        this.clearUser(); 
      }),
      catchError((error) => {
        console.error('Error during logout:', error);
        this.clearUser();
        throw error;
      })
    );
  }

  clearUser(): void {
    this.userSubject.next(null);
    this.hasFetched = false;
  }
}