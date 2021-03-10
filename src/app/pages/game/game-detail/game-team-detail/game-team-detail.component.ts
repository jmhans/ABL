import { Component, OnInit, Input  } from '@angular/core';

interface gameTeam {
  away_score: {} 
  home_score: {}
  awayTeam: {}
  homeTeam: {}
}


@Component({
  selector: 'app-game-team-detail',
  templateUrl: './game-team-detail.component.html',
  styleUrls: ['./game-team-detail.component.scss']
})




export class GameTeamDetailComponent implements OnInit {

  @Input() roster: gameTeam ;
  @Input() teamLoc: string;
  @Input() teamScore: {};
    displayedColumns: string[] = ['position', 'name', 'hits', 'atbats'];

  constructor() { }

  ngOnInit(): void {
  }

}