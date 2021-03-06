
// src/app/pages/games/games.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiService } from './../../core/api.service';
import { AblGameService } from './../../core/services/abl-game.service';
import { UtilsService } from './../../core/utils.service';
import { FilterSortService } from './../../core/filter-sort.service';
import { Subscription } from 'rxjs';
import { GameModel } from './../../core/models/game.model';
import {MatDatepickerModule ,MatDatepickerInputEvent} from '@angular/material/datepicker';
import {FormControl} from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthService } from './../../auth/auth.service';


@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.scss']
})
export class GamesComponent implements OnInit, OnDestroy {
  pageTitle = 'Games';
  gamesListSub: Subscription;
  gamesList: GameModel[];
  filteredGames: GameModel[];
  loading: boolean;
  error: boolean;
  query: string = '';
  modelDate: FormControl;
  attestSub: Subscription;

  headings = ['Description', 'Date', 'Away Score', 'Home Score', 'Away Attestation', 'Home Attestation'];
  
  
  
  constructor(
    private title: Title,
    public utils: UtilsService,
    private api: ApiService,
    private ablGame: AblGameService,
    public fs: FilterSortService, 
    private datePipe: DatePipe, 
     private auth: AuthService
  ) { }

  ngOnInit() {
    this.title.setTitle(this.pageTitle);
    this._getGamesList();
    this.modelDate = new FormControl(/*new Date()*/);
    
  }
  
  _dateChanged(type: string, event: MatDatepickerInputEvent<Date>) {
    //
    //this.filteredGames = this.fs.search(this.gamesList, this.datePipe.transform(this.modelDate.value, 'mediumDate'), '_id', 'mediumDate')
    //this.query = this.datePipe.transform(this.modelDate.value, 'mediumDate');
    this.searchGames();
  }

  private _getGamesList() {
    this.loading = true;
    // Get future, public events
    this.gamesListSub = this.api
      .getAblGames$()
      .subscribe(
        res => {
          this.gamesList = res;
          this.filteredGames = res;
          this.loading = false;
        },
        err => {
          console.error(err);
          this.loading = false;
          this.error = true;
        }
      );
  }

  getGameAttester(allAttestations, loc) {
    if (allAttestations) {
      return allAttestations.find((a)=> {return a.attesterType == loc });  
    }
    
  }
  
  getGameScore(gm, loc) {
    if (gm.results && gm.results.scores) {
        return gm.results.scores.find((g)=> {return g.location == loc})    
    }
  }
  
  _userInGame(tm) {
    if (!tm) return null;
    
    return tm.owners.find((o)=> { return this.auth.userProfile.sub == o.userId})
  }
  
  
  
  _saveResult(gm) {
    var attestSub = this.ablGame.attestGame$(gm._id, 
                                                 gm.results, 
                                                 {attester: this.auth.userProfile.sub, attesterType: this.ablGame.gameParticipant(gm, this.auth.userProfile.sub)}
                                                ).subscribe(
      res => {
        console.log(res)
      },
      err => {
        console.error(err);
      }
    )
  }
  
  
  
  
  searchGames() {
    var searchInput = this.gamesList
    if (this.modelDate.value) { 
      searchInput = this.gamesList.filter((g)=> {return this.datePipe.transform(g.gameDate, 'mediumDate') == this.datePipe.transform(this.modelDate.value, 'mediumDate')})
    }
    this.filteredGames = this.fs.search(searchInput, this.query, '_id', 'mediumDate');
    
  }

  resetQuery() {
    this.modelDate.reset();
    this.query = '';
    this.filteredGames = this.gamesList;
  }

  ngOnDestroy() {
    this.gamesListSub.unsubscribe();
    if (this.attestSub) {
      this.attestSub.unsubscribe();
    }
  }
  
  hasProp(o, name) {
  return o.hasOwnProperty(name);
}

}



