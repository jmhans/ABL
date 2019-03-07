// src/app/pages/player/players.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from './../../auth/auth.service';
import { ApiService } from './../../core/api.service';
import { UtilsService } from './../../core/utils.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { MlbPlayerModel } from './../../core/models/mlb.player.model';
import { RosterRecordModel } from './../../core/models/roster.record.model';
import { FilterSortService } from './../../core/filter-sort.service';
import { RosterService } from './../../core/services/roster.service';

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.scss']
})
export class PlayersComponent implements OnInit, OnDestroy {
  pageTitle = 'Players';
  playerListSub: Subscription;
  playerList: MlbPlayerModel[];
  filteredPlayers: MlbPlayerModel[];
  loading: boolean;
  error: boolean;
  query: '';
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();
  actionPlayer: MlbPlayerModel;
  rosterUpdateSub: Subscription;
  submitting: boolean;
  
  constructor(private title: Title, 
              public utils: UtilsService, 
              private api: ApiService, 
              public fs: FilterSortService, 
              private rosterService: RosterService, 
              private auth: AuthService) { }

  ngOnInit() {
    this.title.setTitle(this.pageTitle);
    
    this.dtOptions = {
      pagingType: 'full_numbers', 
      pageLength: 2, 
    }
    this._getPlayerList();
  }
  
  private _getPlayerList() {
    this.loading = true;
    // Get future, public events
    this.playerListSub = this.api
      .getMlbPlayers$()
      .subscribe(
        res => {
          this.playerList = res;
          this.filteredPlayers = res;
          this.loading = false;
          this.dtTrigger.next();
        },
        err => {
          console.error(err);
          this.loading = false;
          this.error = true;
        }
      );
  }
  



  
  searchPlayers() {
    this.filteredPlayers = this.fs.search(this.playerList, this.query, '_id', 'mediumDate');
  }

  resetQuery() {
    this.query = '';
    this.filteredPlayers = this.playerList;
  }
  
   private _handleSubmitSuccess(res) {
    this.error = false;
    this.submitting = false;
  }

  private _handleSubmitError(err) {
    console.error(err);
    this.submitting = false;
    this.error = true;
  }

  

  ngOnDestroy() {
    this.playerListSub.unsubscribe();
    this.dtTrigger.unsubscribe();
    if(this.rosterUpdateSub) { 
      this.rosterUpdateSub.unsubscribe();
    }
  }

}