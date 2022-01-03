/// <reference types="cypress" />


describe('unigraph sample test', () => {
    // should reset the db before tests
    beforeEach(() => {
        cy.visit('/');
    });

    it('should have Apps', ()=>{
        cy.contains('Apps')
    })

    xit('should be able to create a daily note', ()=>{
        // doesn't work yet bc can't reset state after creating note for the first time
        cy.contains('+ Add daily note').click()
        cy.contains('Click here to start writing').click()
        cy.focused().type('Dear diary...')
    })
    it('should be able to create a note and write in it', ()=>{
        cy.get('body').type('{ctrl+e}')
        cy.get('input').type(`+n test note ${(new Date()).getTime()} {enter}`)
        cy.contains('Click here to start writing').click()
        cy.focused().type('Test note...')
    })


});
